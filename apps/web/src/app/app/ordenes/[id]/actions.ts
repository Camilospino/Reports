"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/session";
import { noticeText, siteUrl, type NoticeKind } from "@/lib/messages";

type Result = { error?: string };

const id = z.guid();
const path = (orderId: string) => `/app/ordenes/${orderId}`;

// Errores de la base de datos que el usuario puede entender.
function dbError(error: { code?: string; message: string } | null, fallback: string): Result {
  if (!error) return {};
  if (error.code === "42501" || error.code === "23514") return { error: error.message };
  return { error: fallback };
}

// --- Lista de chequeo -------------------------------------------------------
export async function toggleChecklistItem(orderId: string, index: number, done: boolean): Promise<Result> {
  const { supabase, company } = await requireStaff();
  if (!id.safeParse(orderId).success || !Number.isInteger(index) || index < 0) return { error: "Datos inválidos." };

  const { data: order } = await supabase
    .from("work_orders")
    .select("checklist_state")
    .eq("id", orderId)
    .eq("company_id", company.id)
    .maybeSingle();
  const list = Array.isArray(order?.checklist_state) ? (order.checklist_state as { label: string; done: boolean }[]) : null;
  if (!list?.[index]) return { error: "No encontramos ese ítem." };

  const next = list.map((c, i) => (i === index ? { ...c, done } : c));
  const { error } = await supabase.from("work_orders").update({ checklist_state: next }).eq("id", orderId).eq("company_id", company.id);
  revalidatePath(path(orderId));
  return dbError(error, "No se pudo actualizar la lista de chequeo.");
}

// --- Materiales y mano de obra ---------------------------------------------
const itemSchema = z.object({
  description: z.string().trim().min(2, "Escribe la descripción del ítem.").max(200),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor que 0.").max(100_000),
  unit_price: z.coerce.number().min(0, "El valor no puede ser negativo.").max(10_000_000_000),
  material_id: z.guid().nullable().optional(),
});
export type ItemInput = z.input<typeof itemSchema>;

export async function addItem(orderId: string, input: ItemInput): Promise<Result> {
  const { supabase, company } = await requireStaff();
  const parsed = itemSchema.safeParse(input);
  if (!id.safeParse(orderId).success) return { error: "Datos inválidos." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data: order } = await supabase.from("work_orders").select("id").eq("id", orderId).eq("company_id", company.id).maybeSingle();
  if (!order) return { error: "No encontramos la orden." };
  const { error } = await supabase.from("work_order_items").insert({ work_order_id: orderId, company_id: company.id, ...parsed.data });
  revalidatePath(path(orderId));
  return dbError(error, "No se pudo agregar el ítem.");
}

export async function updateItem(orderId: string, itemId: string, input: ItemInput): Promise<Result> {
  const { supabase, company } = await requireStaff();
  const parsed = itemSchema.safeParse(input);
  if (!id.safeParse(orderId).success || !id.safeParse(itemId).success) return { error: "Datos inválidos." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await supabase
    .from("work_order_items")
    .update({ description: parsed.data.description, quantity: parsed.data.quantity, unit_price: parsed.data.unit_price })
    .eq("id", itemId)
    .eq("work_order_id", orderId)
    .eq("company_id", company.id)
    .select("id");
  revalidatePath(path(orderId));
  if (!error && !data?.length) return { error: "No encontramos ese ítem." };
  return dbError(error, "No se pudo guardar el ítem.");
}

export async function deleteItem(orderId: string, itemId: string): Promise<Result> {
  const { supabase, company } = await requireStaff();
  if (!id.safeParse(orderId).success || !id.safeParse(itemId).success) return { error: "Datos inválidos." };
  const { error } = await supabase
    .from("work_order_items")
    .delete()
    .eq("id", itemId)
    .eq("work_order_id", orderId)
    .eq("company_id", company.id);
  revalidatePath(path(orderId));
  return dbError(error, "No se pudo quitar el ítem.");
}

// --- Fotos ------------------------------------------------------------------
const photoSchema = z.object({
  kind: z.enum(["foto_antes", "foto_despues"]),
  caption: z.string().trim().max(120).optional(),
  storagePath: z.string().min(1),
});

// La foto ya se subió a Storage desde el navegador (con las políticas del bucket); aquí se registra.
export async function addPhoto(orderId: string, input: z.input<typeof photoSchema>): Promise<Result> {
  const { supabase, company } = await requireStaff();
  const parsed = photoSchema.safeParse(input);
  if (!id.safeParse(orderId).success || !parsed.success) return { error: "Datos inválidos." };
  if (!parsed.data.storagePath.startsWith(`${company.id}/${orderId}/`)) return { error: "Ruta de archivo inválida." };

  const { error } = await supabase.from("attachments").insert({
    work_order_id: orderId,
    company_id: company.id, // lo vuelve a fijar el trigger desde la orden
    kind: parsed.data.kind,
    caption: parsed.data.caption || null,
    storage_path: parsed.data.storagePath,
  });
  revalidatePath(path(orderId));
  return dbError(error, "No se pudo guardar la foto.");
}

export async function deletePhoto(orderId: string, attachmentId: string): Promise<Result> {
  const { supabase, company } = await requireStaff();
  if (!id.safeParse(orderId).success || !id.safeParse(attachmentId).success) return { error: "Datos inválidos." };
  const { data } = await supabase
    .from("attachments")
    .delete()
    .eq("id", attachmentId)
    .eq("work_order_id", orderId)
    .eq("company_id", company.id)
    .select("storage_path");
  if (!data?.length) return { error: "No se pudo quitar la foto." };
  await supabase.storage.from("evidencias").remove(data.map((a) => a.storage_path));
  revalidatePath(path(orderId));
  return {};
}

// --- Avisos al cliente por WhatsApp -----------------------------------------
// El navegador abre wa.me; aquí se registra en el historial el mensaje (armado en el servidor).
export async function logNotice(orderId: string, kind: NoticeKind): Promise<Result> {
  const { supabase, company } = await requireStaff();
  if (!id.safeParse(orderId).success || !["en_camino", "reporte"].includes(kind)) return { error: "Datos inválidos." };

  const { data: o } = await supabase
    .from("work_orders")
    .select("scheduled_start, status, public_token, customers(name, contact_name, phone_whatsapp), memberships(full_name)")
    .eq("id", orderId)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!o?.customers?.phone_whatsapp) return { error: "El cliente no tiene WhatsApp registrado." };

  const message = noticeText(kind, {
    contact: o.customers.contact_name ?? o.customers.name,
    technician: o.memberships?.full_name ?? null,
    company: company.name,
    start: o.scheduled_start,
    reportUrl: o.status === "completada" && o.public_token ? `${await siteUrl()}/r/${o.public_token}` : null,
  });
  if (!message) return { error: "El reporte estará disponible cuando la orden esté completada." };

  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("work_order_events").insert({
    work_order_id: orderId,
    company_id: company.id,
    type: "aviso_whatsapp",
    user_id: auth.user!.id,
    payload: { tipo: kind, mensaje: message, telefono: o.customers.phone_whatsapp },
  });
  revalidatePath(path(orderId));
  return dbError(error, "El mensaje se abrió en WhatsApp, pero no quedó en el historial.");
}

// --- Facturar y cotizar -----------------------------------------------------
export async function invoiceOrder(orderId: string): Promise<Result> {
  const { supabase, company } = await requireStaff();
  if (!id.safeParse(orderId).success) return { error: "Datos inválidos." };
  const { data, error } = await supabase
    .from("work_orders")
    .update({ invoiced_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("company_id", company.id)
    .select("id");
  revalidatePath(path(orderId));
  revalidatePath("/app");
  if (!error && !data?.length) return { error: "No encontramos la orden." };
  return dbError(error, "No se pudo facturar la orden.");
}

// Crea un borrador de cotización con el cliente y los ítems de la orden.
export async function quoteFromOrder(orderId: string): Promise<Result> {
  const { supabase, company } = await requireStaff();
  if (!id.safeParse(orderId).success) return { error: "Datos inválidos." };

  const { data: o } = await supabase
    .from("work_orders")
    .select("customer_id, title, work_order_items(material_id, description, quantity, unit_price)")
    .eq("id", orderId)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!o) return { error: "No encontramos la orden." };

  const items = o.work_order_items.map((i) => ({
    material_id: i.material_id,
    description: i.description,
    quantity: Number(i.quantity),
    unit_price: Number(i.unit_price),
  }));
  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      company_id: company.id,
      customer_id: o.customer_id,
      items,
      notes: o.title,
      valid_until: new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (error) return dbError(error, "No se pudo crear la cotización.");
  redirect(`/app/cotizaciones/${quote.id}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/session";
import { decimal, firstIssue, optionalText, requiredText } from "@/lib/forms";
import type { FormState } from "@/lib/format";

// Catálogo de materiales y tipos de servicio. Dueño y despachador (lo exige la RLS).
// El stock solo cambia con adjust_stock() o al cerrar órdenes: queda el movimiento registrado.

const materialSchema = z.object({
  name: requiredText(2, 120, "Escribe el nombre del material."),
  sku: optionalText(40),
  unit: requiredText(1, 12, "Escribe la unidad (und, m, lb…)."),
  unit_price: decimal("Escribe un precio válido."),
  min_stock: decimal("Escribe un stock mínimo válido (0 si no aplica)."),
  track_stock: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const serviceSchema = z.object({
  name: requiredText(2, 120, "Escribe el nombre del servicio."),
  estimated_minutes: z.coerce.number().int().min(15, "La duración mínima es 15 minutos.").max(1440, "La duración máxima es 24 horas."),
  skill: optionalText(40),
  warranty_months: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 60), "La garantía va de 0 a 60 meses."),
  checklist: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split("\n")
        .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
        .filter(Boolean),
    )
    .refine((v) => v.length <= 30, "Máximo 30 pasos en la lista de chequeo.")
    .refine((v) => v.every((s) => s.length <= 120), "Cada paso puede tener máximo 120 caracteres."),
});

const revalidate = (id?: string) => {
  revalidatePath("/app/inventario");
  if (id) revalidatePath(`/app/inventario/${id}`);
};

export async function createMaterial(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const raw = Object.fromEntries(fd);
  const parsed = materialSchema.safeParse(raw);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const stock = parsed.data.track_stock ? decimal("Escribe un stock inicial válido.").safeParse(String(raw.stock || "0")) : null;
  if (stock && !stock.success) return { error: firstIssue(stock.error) };

  const { data, error } = await supabase
    .from("materials")
    .insert({ company_id: company.id, ...parsed.data, stock: stock?.data ?? 0 })
    .select("id")
    .single();
  if (error) return { error: "No pudimos crear el material." };
  revalidate();
  redirect(`/app/inventario/${data.id}?nuevo=1`);
}

export async function updateMaterial(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const parsed = materialSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { error } = await supabase.from("materials").update(parsed.data).eq("id", id).eq("company_id", company.id);
  if (error) return { error: "No pudimos guardar los cambios." };
  revalidate(id);
  return { ok: true, message: "Cambios guardados." };
}

const adjustSchema = z.object({
  kind: z.enum(["entrada", "salida", "conteo"], { message: "Escoge el tipo de movimiento." }),
  quantity: decimal("Escribe una cantidad válida."),
  note: optionalText(120),
});

export async function adjustStock(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireStaff();
  const parsed = adjustSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { kind, quantity, note } = parsed.data;
  if (kind !== "conteo" && quantity === 0) return { error: "La cantidad debe ser mayor que cero." };

  const { error } = await supabase.rpc("adjust_stock", {
    p_material: id,
    p_kind: kind,
    p_quantity: quantity,
    p_note: note ?? undefined,
  });
  if (error?.message.includes("negativo")) return { error: "No hay tanto stock para esa salida." };
  if (error) return { error: "No pudimos registrar el movimiento." };
  revalidate(id);
  return { ok: true, message: "Movimiento registrado." };
}

export async function setMaterialActive(id: string, active: boolean): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const { error } = await supabase.from("materials").update({ active }).eq("id", id).eq("company_id", company.id);
  if (error) return { error: "No pudimos cambiar el material." };
  revalidate(id);
  return { ok: true, message: active ? "El material volvió al catálogo." : "Material archivado: ya no aparece al agregar materiales." };
}

export async function createService(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const parsed = serviceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { error } = await supabase.from("service_types").insert({ company_id: company.id, ...parsed.data });
  if (error) return { error: "No pudimos crear el tipo de servicio." };
  revalidatePath("/app/inventario");
  redirect("/app/inventario?tab=servicios");
}

export async function updateService(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const parsed = serviceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { error } = await supabase.from("service_types").update(parsed.data).eq("id", id).eq("company_id", company.id);
  if (error) return { error: "No pudimos guardar los cambios." };
  revalidatePath("/app/inventario");
  revalidatePath(`/app/inventario/servicios/${id}`);
  return { ok: true, message: "Cambios guardados. Aplican a las órdenes nuevas." };
}

export async function setServiceActive(id: string, active: boolean): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const { error } = await supabase.from("service_types").update({ active }).eq("id", id).eq("company_id", company.id);
  if (error) return { error: "No pudimos cambiar el tipo de servicio." };
  revalidatePath("/app/inventario");
  revalidatePath(`/app/inventario/servicios/${id}`);
  return { ok: true, message: active ? "El servicio volvió al catálogo." : "Servicio archivado: ya no aparece al crear órdenes." };
}

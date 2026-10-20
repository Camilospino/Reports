"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/session";
import { firstIssue, optionalEmail, optionalLocation, optionalPhone, optionalText, requiredText } from "@/lib/forms";
import type { FormState } from "@/lib/format";

// Clientes, sus sedes y sus equipos. Todo con la sesión del usuario: la RLS solo deja
// escribir a dueño y despachador, y siempre dentro de su empresa.

const customerSchema = z.object({
  name: requiredText(2, 120, "Escribe el nombre del cliente."),
  contact_name: optionalText(120),
  phone_whatsapp: optionalPhone,
  email: optionalEmail,
  tax_id: optionalText(30),
  notes: optionalText(500),
});

const siteSchema = z.object({
  address: requiredText(3, 200, "Escribe la dirección."),
  neighborhood: optionalText(80),
  city: optionalText(80),
  location: optionalLocation,
  access_notes: optionalText(300),
});

const assetSchema = z.object({
  type: requiredText(2, 60, "Escribe qué equipo es (aire, DVR, cámara…)."),
  brand: optionalText(60),
  model: optionalText(60),
  serial: optionalText(60),
});

const siteRow = ({ location, ...s }: z.infer<typeof siteSchema>) => ({ ...s, lat: location?.lat ?? null, lng: location?.lng ?? null });

export async function createCustomer(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const raw = Object.fromEntries(fd);
  const customer = customerSchema.safeParse(raw);
  if (!customer.success) return { error: firstIssue(customer.error) };
  const withSite = String(raw.address ?? "").trim() !== "";
  const site = withSite ? siteSchema.safeParse(raw) : null;
  if (site && !site.success) return { error: firstIssue(site.error) };

  const { data, error } = await supabase
    .from("customers")
    .insert({ company_id: company.id, ...customer.data })
    .select("id")
    .single();
  if (error) return { error: "No pudimos crear el cliente." };
  if (site?.success) {
    const { error: siteError } = await supabase
      .from("sites")
      .insert({ company_id: company.id, customer_id: data.id, ...siteRow(site.data) });
    if (siteError) return { error: "El cliente quedó creado, pero no pudimos guardar la dirección." };
  }
  revalidatePath("/app/clientes");
  redirect(`/app/clientes/${data.id}?nuevo=1`);
}

export async function updateCustomer(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const parsed = customerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { error } = await supabase.from("customers").update(parsed.data).eq("id", id).eq("company_id", company.id);
  if (error) return { error: "No pudimos guardar los cambios." };
  revalidatePath(`/app/clientes/${id}`);
  return { ok: true, message: "Cambios guardados." };
}

export async function deleteCustomer(id: string): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const { error, count } = await supabase
    .from("customers")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("company_id", company.id);
  // 23503: tiene órdenes o cotizaciones que lo citan.
  if (error?.code === "23503")
    return { error: "No se puede eliminar: el cliente tiene órdenes o cotizaciones. Su historial se conserva." };
  if (error || !count) return { error: "No pudimos eliminar el cliente." };
  revalidatePath("/app/clientes");
  redirect("/app/clientes");
}

export async function addSite(customerId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const parsed = siteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { error } = await supabase
    .from("sites")
    .insert({ company_id: company.id, customer_id: customerId, ...siteRow(parsed.data) });
  if (error) return { error: "No pudimos agregar la sede." };
  revalidatePath(`/app/clientes/${customerId}`);
  return { ok: true, message: "Sede agregada." };
}

export async function updateSite(customerId: string, siteId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const parsed = siteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { error } = await supabase
    .from("sites")
    .update(siteRow(parsed.data))
    .eq("id", siteId)
    .eq("customer_id", customerId)
    .eq("company_id", company.id);
  if (error) return { error: "No pudimos guardar la sede." };
  revalidatePath(`/app/clientes/${customerId}`);
  return { ok: true, message: "Sede guardada." };
}

export async function deleteSite(customerId: string, siteId: string): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  // Las órdenes viejas guardan la dirección por la sede: si tiene órdenes no se borra.
  const { count } = await supabase
    .from("work_orders")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company.id)
    .eq("site_id", siteId);
  if (count) return { error: "Esta sede tiene órdenes. Edita la dirección en vez de eliminarla." };
  const { error } = await supabase.from("sites").delete().eq("id", siteId).eq("company_id", company.id);
  if (error) return { error: "No pudimos eliminar la sede." };
  revalidatePath(`/app/clientes/${customerId}`);
  return { ok: true };
}

export async function addAsset(customerId: string, siteId: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const parsed = assetSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { error } = await supabase.from("assets").insert({ company_id: company.id, site_id: siteId, ...parsed.data });
  if (error) return { error: "No pudimos agregar el equipo." };
  revalidatePath(`/app/clientes/${customerId}`);
  return { ok: true, message: "Equipo agregado." };
}

export async function deleteAsset(customerId: string, assetId: string): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const { error } = await supabase.from("assets").delete().eq("id", assetId).eq("company_id", company.id);
  if (error) return { error: "No pudimos eliminar el equipo." };
  revalidatePath(`/app/clientes/${customerId}`);
  return { ok: true };
}

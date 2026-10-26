"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/session";
import { bogotaToIso, normalizePhone, parseCoordinates, type FormState } from "@/lib/format";

// Campo de texto opcional: vacío → null.
const optional = z
  .string()
  .optional()
  .transform((v) => v?.trim() || null);

const schema = z
  .object({
    customer_id: z.string().min(1, "Escoge un cliente o crea uno nuevo."),
    customer_name: optional,
    customer_contact: optional,
    customer_phone: optional,
    site_id: optional,
    address: optional,
    neighborhood: optional,
    city: optional,
    location: optional,
    asset_id: optional,
    installation_id: optional,
    service_type_id: optional,
    title: z.string().trim().min(3, "Escribe un título para la orden."),
    description: optional,
    priority: z.enum(["baja", "normal", "alta"]),
    date: optional,
    time: optional,
    technician_id: optional,
  })
  .superRefine((v, ctx) => {
    if (v.customer_id === "new" && !v.customer_name)
      ctx.addIssue({ code: "custom", message: "Escribe el nombre del cliente nuevo." });
    if ((v.customer_id === "new" || v.site_id === "new") && !v.address)
      ctx.addIssue({ code: "custom", message: "Escribe la dirección." });
    if (v.location && !parseCoordinates(v.location))
      ctx.addIssue({
        code: "custom",
        message: "No encontramos coordenadas en ese enlace. Pega el enlace largo de Google Maps o algo como 4.65, -74.06.",
      });
    if (Boolean(v.date) !== Boolean(v.time)) ctx.addIssue({ code: "custom", message: "Escribe fecha y hora, o deja ambas vacías." });
  });

export async function createWorkOrder(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireStaff();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  let customerId = v.customer_id;
  if (customerId === "new") {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        company_id: company.id,
        name: v.customer_name!,
        contact_name: v.customer_contact,
        phone_whatsapp: v.customer_phone ? normalizePhone(v.customer_phone) : null,
      })
      .select("id")
      .single();
    if (error) return { error: "No se pudo crear el cliente." };
    customerId = data.id;
  }

  let siteId = v.customer_id === "new" ? "new" : v.site_id;
  if (siteId === "new") {
    const coords = v.location ? parseCoordinates(v.location) : null;
    const { data, error } = await supabase
      .from("sites")
      .insert({
        company_id: company.id,
        customer_id: customerId,
        address: v.address!,
        neighborhood: v.neighborhood,
        city: v.city,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
      .select("id")
      .single();
    if (error) return { error: "No se pudo guardar la dirección." };
    siteId = data.id;
  }

  const { data: order, error } = await supabase
    .from("work_orders")
    .insert({
      company_id: company.id,
      customer_id: customerId,
      site_id: siteId,
      asset_id: v.asset_id,
      installation_id: v.installation_id,
      service_type_id: v.service_type_id,
      title: v.title,
      description: v.description,
      priority: v.priority,
      technician_id: v.technician_id,
      scheduled_start: v.date && v.time ? bogotaToIso(v.date, v.time) : null,
    })
    .select("id")
    .single();
  if (error)
    return {
      error: error.code === "23514" ? error.message : "No se pudo crear la orden. Revisa los datos e intenta de nuevo.",
    };

  redirect(`/app/ordenes/${order.id}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/session";
import type { QuoteStatus } from "@/lib/quotes";

type Result = { error?: string };

const schema = z.object({
  customer_id: z.guid("Escoge un cliente."),
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Escribe hasta cuándo es válida.")
    .nullable(),
  notes: z.string().trim().max(2000).nullable(),
  items: z
    .array(
      z.object({
        material_id: z.guid().nullable().optional(),
        description: z.string().trim().min(2, "Cada ítem necesita una descripción.").max(200),
        quantity: z.number().positive("Las cantidades deben ser mayores que 0.").max(100_000),
        unit_price: z.number().min(0, "Los valores no pueden ser negativos.").max(10_000_000_000),
      }),
    )
    .min(1, "Agrega al menos un ítem.")
    .max(100),
});
export type QuoteInput = z.input<typeof schema>;

const id = z.guid();
const EDITABLE: QuoteStatus[] = ["borrador", "enviada"];

export async function saveQuote(quoteId: string | null, input: QuoteInput): Promise<Result> {
  const { supabase, company } = await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const v = { ...parsed.data, notes: parsed.data.notes || null };

  if (!quoteId) {
    const { data, error } = await supabase.from("quotes").insert({ company_id: company.id, ...v }).select("id").single();
    if (error) return { error: "No se pudo crear la cotización." };
    revalidatePath("/app/cotizaciones");
    redirect(`/app/cotizaciones/${data.id}`);
  }

  if (!id.safeParse(quoteId).success) return { error: "Datos inválidos." };
  const { data, error } = await supabase
    .from("quotes")
    .update(v)
    .eq("id", quoteId)
    .eq("company_id", company.id)
    .in("status", EDITABLE)
    .select("id");
  if (error) return { error: "No se pudo guardar la cotización." };
  if (!data.length) return { error: "Esta cotización ya no se puede editar." };
  revalidatePath("/app/cotizaciones");
  revalidatePath(`/app/cotizaciones/${quoteId}`);
  return {};
}

// "enviada" al compartirla; "aprobada" o "rechazada" según responda el cliente.
export async function setQuoteStatus(quoteId: string, status: "enviada" | "aprobada" | "rechazada"): Promise<Result> {
  const { supabase, company } = await requireStaff();
  if (!id.safeParse(quoteId).success || !["enviada", "aprobada", "rechazada"].includes(status)) return { error: "Datos inválidos." };
  const from: QuoteStatus[] = status === "enviada" ? ["borrador", "enviada"] : ["enviada", "aprobada", "rechazada"];
  const { data, error } = await supabase
    .from("quotes")
    .update({ status })
    .eq("id", quoteId)
    .eq("company_id", company.id)
    .in("status", from)
    .select("id");
  if (error) return { error: "No se pudo actualizar la cotización." };
  if (!data.length) return { error: status === "enviada" ? "La cotización ya fue respondida." : "Primero envía la cotización." };
  revalidatePath("/app/cotizaciones");
  revalidatePath(`/app/cotizaciones/${quoteId}`);
  revalidatePath("/app");
  return {};
}

export async function convertQuote(quoteId: string): Promise<Result> {
  const { supabase } = await requireStaff();
  if (!id.safeParse(quoteId).success) return { error: "Datos inválidos." };
  const { data, error } = await supabase.rpc("convert_quote_to_order", { p_quote: quoteId });
  if (error) return { error: error.code === "23514" ? error.message : "No se pudo crear la orden." };
  revalidatePath("/app/cotizaciones");
  redirect(`/app/ordenes/${data}`);
}

export async function deleteQuote(quoteId: string): Promise<Result> {
  const { supabase, company } = await requireStaff();
  if (!id.safeParse(quoteId).success) return { error: "Datos inválidos." };
  const { data } = await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId)
    .eq("company_id", company.id)
    .eq("status", "borrador")
    .select("id");
  if (!data?.length) return { error: "Solo se pueden borrar borradores." };
  revalidatePath("/app/cotizaciones");
  redirect("/app/cotizaciones");
}

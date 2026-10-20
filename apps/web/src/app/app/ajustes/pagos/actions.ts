"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/session";
import type { FormState } from "@/lib/format";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => v || null);

const schema = z
  .object({
    payment_nequi: z
      .string()
      .optional()
      .transform((v) => (v ?? "").replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "") || null)
      .refine((v) => v === null || /^3\d{9}$/.test(v), "El Nequi es un celular de 10 dígitos que empieza por 3."),
    payment_bank: optional(60),
    payment_account_type: z
      .enum(["ahorros", "corriente", ""])
      .optional()
      .transform((v) => v || null),
    payment_account_number: z
      .string()
      .trim()
      .optional()
      .transform((v) => v?.replace(/\s/g, "") || null)
      .refine((v) => v === null || /^[0-9-]{4,30}$/.test(v), "El número de cuenta solo lleva números y guiones."),
    payment_account_holder: optional(120),
    payment_holder_id: optional(30),
    payment_notes: optional(300),
  })
  .refine((v) => !v.payment_account_number || (v.payment_bank && v.payment_account_type), {
    message: "Para la transferencia escribe el banco y el tipo de cuenta.",
  });

// Datos de pago que ve el cliente en el reporte. Solo el dueño (lo exige también la RLS).
export async function savePayment(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireOwner();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase.from("companies").update(parsed.data).eq("id", company.id);
  if (error) return { error: "No pudimos guardar los datos de pago." };
  revalidatePath("/app/ajustes/pagos");
  return { ok: true, message: "Listo. Tus clientes verán estos datos al tocar «Pagar» en el reporte." };
}

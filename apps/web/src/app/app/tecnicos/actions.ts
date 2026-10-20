"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/session";
import { firstIssue, optionalPhone, requiredText } from "@/lib/forms";
import type { FormState } from "@/lib/format";

const schema = z.object({
  full_name: requiredText(2, 120, "Escribe el nombre."),
  phone: optionalPhone,
  skills: z
    .string()
    .optional()
    .transform((v) => [...new Set((v ?? "").split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 12)),
});

// Datos del técnico. Solo el dueño (la RLS de memberships tampoco deja a nadie más).
export async function updateTechnician(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireOwner();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { error, count } = await supabase
    .from("memberships")
    .update(parsed.data, { count: "exact" })
    .eq("id", id)
    .eq("company_id", company.id)
    .eq("role", "technician");
  if (error || !count) return { error: "No pudimos guardar los cambios." };
  revalidatePath("/app/tecnicos");
  revalidatePath(`/app/tecnicos/${id}`);
  return { ok: true, message: "Cambios guardados." };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/session";
import type { FormState } from "@/lib/format";

const schema = z.object({
  enabled: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  days: z.coerce.number().int("Escribe un número entero de días.").min(1, "Mínimo 1 día.").max(60, "Máximo 60 días."),
});

// Activa o apaga la creación automática de órdenes de mantenimiento. Solo el dueño (lo exige la RLS).
export async function saveMaintenanceSettings(_: FormState, fd: FormData): Promise<FormState> {
  const { supabase, company } = await requireOwner();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const auto_maintenance_days = parsed.data.enabled ? parsed.data.days : null;
  const { error } = await supabase.from("companies").update({ auto_maintenance_days }).eq("id", company.id);
  if (error) return { error: "No pudimos guardar la configuración." };
  revalidatePath("/app/ajustes/mantenimientos");
  return {
    ok: true,
    message: auto_maintenance_days
      ? `Listo. Cada mañana crearemos la orden de los mantenimientos que venzan en los próximos ${auto_maintenance_days} días.`
      : "Listo. Ya no crearemos órdenes de mantenimiento automáticamente.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/session";
import { SNAP, dateKeyOf } from "@/lib/agenda";
import { shortDate, time } from "@/lib/format";

const schema = z.object({
  orderId: z.guid(),
  technicianId: z.guid(),
  start: z.iso.datetime({ offset: true }),
});

const SNAP_MS = SNAP * 60_000;

// Asigna la orden a un técnico a una hora (o la reprograma). El estado pasa a "asignada"
// y el historial ("asignada" / "reprogramada") lo registran los triggers de la base de datos.
export async function scheduleOrder(input: z.input<typeof schema>): Promise<{ error?: string }> {
  const { supabase, company } = await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos." };
  const { orderId, technicianId } = parsed.data;
  const start = new Date(Math.round(Date.parse(parsed.data.start) / SNAP_MS) * SNAP_MS);

  const { data: order } = await supabase
    .from("work_orders")
    .select("status, scheduled_start, scheduled_end, service_types(estimated_minutes)")
    .eq("id", orderId)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!order) return { error: "No encontramos la orden." };
  if (order.status !== "pendiente" && order.status !== "asignada")
    return { error: "Solo se pueden mover órdenes pendientes o asignadas. Esta ya está en curso o cerrada." };

  // Conserva la duración que tenía; si no tenía, usa la del tipo de servicio.
  const durationMs =
    order.scheduled_start && order.scheduled_end
      ? Date.parse(order.scheduled_end) - Date.parse(order.scheduled_start)
      : (order.service_types?.estimated_minutes ?? 60) * 60_000;
  const end = new Date(start.getTime() + durationMs);

  const { data: absence } = await supabase
    .from("absences")
    .select("reason, starts_at, ends_at, memberships(full_name)")
    .eq("company_id", company.id)
    .eq("technician_id", technicianId)
    .lt("starts_at", end.toISOString())
    .gt("ends_at", start.toISOString())
    .limit(1)
    .maybeSingle();
  if (absence) {
    const lastMoment = new Date(Date.parse(absence.ends_at) - 1);
    const when =
      dateKeyOf(absence.starts_at) === dateKeyOf(lastMoment.toISOString())
        ? `${time(absence.starts_at)} a ${time(absence.ends_at)}`
        : `del ${shortDate(absence.starts_at)} al ${shortDate(lastMoment)}`;
    const who = absence.memberships?.full_name ?? "El técnico";
    return { error: `${who} no está disponible a esa hora (${absence.reason.toLowerCase()}, ${when}).` };
  }

  const { data, error } = await supabase
    .from("work_orders")
    .update({ technician_id: technicianId, scheduled_start: start.toISOString(), scheduled_end: end.toISOString() })
    .eq("id", orderId)
    .eq("company_id", company.id)
    .select("id");
  if (error?.code === "23514") return { error: "Ese técnico no está activo en la empresa." };
  if (error || !data?.length) return { error: "No se pudo asignar la orden. Intenta de nuevo." };

  revalidatePath("/app/agenda");
  revalidatePath("/app");
  return {};
}

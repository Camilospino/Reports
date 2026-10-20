import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@tecnio/db";
import { bogotaDateKey, bogotaDayRange, time, type WorkOrderStatus } from "@/lib/format";

// Datos de la pantalla de técnicos: carga del día, cierres del mes y calificaciones.

type Client = SupabaseClient<Database>;

export type DayOrder = {
  id: string;
  number: number;
  status: WorkOrderStatus;
  title: string;
  technician_id: string | null;
  scheduled_start: string | null;
  customers: { name: string } | null;
};

export const monthStart = () => bogotaDayRange(`${bogotaDateKey().slice(0, 7)}-01`).start;

export async function loadTechnicianActivity(supabase: Client, companyId: string, technicianId?: string) {
  const today = bogotaDayRange();
  const now = new Date().toISOString();
  let orders = supabase
    .from("work_orders")
    .select("id, number, status, title, technician_id, scheduled_start, customers(name)")
    .eq("company_id", companyId)
    .neq("status", "cancelada")
    .gte("scheduled_start", today.start)
    .lt("scheduled_start", today.end)
    .order("scheduled_start");
  let month = supabase
    .from("work_orders")
    .select("technician_id, total")
    .eq("company_id", companyId)
    .eq("status", "completada")
    .gte("completed_at", monthStart());
  let ratings = supabase.from("work_order_ratings").select("stars, work_orders!inner(technician_id)").eq("company_id", companyId);
  let absences = supabase
    .from("absences")
    .select("technician_id, reason")
    .eq("company_id", companyId)
    .lte("starts_at", now)
    .gt("ends_at", now);
  if (technicianId) {
    orders = orders.eq("technician_id", technicianId);
    month = month.eq("technician_id", technicianId);
    ratings = ratings.eq("work_orders.technician_id", technicianId);
    absences = absences.eq("technician_id", technicianId);
  }

  const results = await Promise.all([orders, month, ratings, absences]);
  for (const r of results) if (r.error) throw new Error(r.error.message);

  const [o, m, r, a] = results;
  return {
    todayOrders: (o.data ?? []) as DayOrder[],
    month: m.data ?? [],
    ratings: (r.data ?? []).map((x) => ({ stars: x.stars, technician_id: x.work_orders.technician_id })),
    absences: a.data ?? [],
  };
}

export type Activity = Awaited<ReturnType<typeof loadTechnicianActivity>>;

export function summarize(a: Activity, technicianId: string) {
  const today = a.todayOrders.filter((o) => o.technician_id === technicianId);
  const month = a.month.filter((o) => o.technician_id === technicianId);
  const stars = a.ratings.filter((r) => r.technician_id === technicianId).map((r) => r.stars);
  const absence = a.absences.find((x) => x.technician_id === technicianId);
  return {
    today,
    todayDone: today.filter((o) => o.status === "completada").length,
    monthDone: month.length,
    monthBilled: month.reduce((n, o) => n + Number(o.total), 0),
    rating: stars.length ? stars.reduce((n, s) => n + s, 0) / stars.length : null,
    ratingCount: stars.length,
    now: nowLabel(today, absence?.reason),
  };
}

// Qué está haciendo el técnico en este momento.
function nowLabel(today: DayOrder[], absence?: string): { label: string; tone: "busy" | "free" | "off" } {
  if (absence) return { label: `Ausente · ${absence}`, tone: "off" };
  const working = today.find((o) => o.status === "en_proceso");
  if (working) return { label: `Trabajando en ${working.customers?.name ?? working.title}`, tone: "busy" };
  const going = today.find((o) => o.status === "en_camino");
  if (going) return { label: `En camino a ${going.customers?.name ?? going.title}`, tone: "busy" };
  const next = today.find((o) => o.status === "asignada" || o.status === "pendiente");
  if (next?.scheduled_start) return { label: `Libre · próxima a las ${time(next.scheduled_start)}`, tone: "free" };
  return { label: today.length ? "Terminó por hoy" : "Sin órdenes hoy", tone: "free" };
}

export const ratingText = (r: number | null) => (r === null ? "—" : r.toLocaleString("es-CO", { maximumFractionDigits: 1, minimumFractionDigits: 1 }));

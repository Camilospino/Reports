import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@tecnio/db";
import { bogotaDayRange, duration, orderCode, time, type WorkOrderStatus } from "@/lib/format";
import type { ChipStatus } from "@/components/ui/status-chip";

type Client = SupabaseClient<Database>;

export type Kpis = {
  orders_total: number;
  orders_completed: number;
  orders_in_progress: number;
  orders_unassigned: number;
  technicians_total: number;
  technicians_in_field: number;
  technicians_offline: number;
  offline_since: string | null;
  quotes_pending: number;
  quotes_pending_total: number;
  billed_month: number;
  billed_prev_month_to_date: number;
};

// Sin reportes durante este tiempo con una orden activa = "Sin conexión".
const OFFLINE_AFTER_MS = 45 * 60_000;
// Una orden que no ha arrancado 15 minutos después de su hora está atrasada.
const LATE_AFTER_MS = 15 * 60_000;

export async function loadDashboard(supabase: Client, companyId: string, now = new Date()) {
  const { start, end } = bogotaDayRange();
  const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000).toISOString();

  const [kpis, orders, technicians, materials, staleQuotes] = await Promise.all([
    supabase.rpc("dashboard_kpis", { p_company: companyId }),
    supabase
      .from("work_orders")
      .select(
        "id, number, status, title, scheduled_start, scheduled_end, technician_id, customers(name), sites(neighborhood), service_types(name), memberships(full_name)",
      )
      .eq("company_id", companyId)
      .gte("scheduled_start", start)
      .lt("scheduled_start", end)
      .order("scheduled_start"),
    supabase
      .from("memberships")
      .select("id, full_name, user_id, skills")
      .eq("company_id", companyId)
      .eq("role", "technician")
      .eq("active", true)
      .order("full_name"),
    supabase
      .from("materials")
      .select("id, name, unit, stock, min_stock")
      .eq("company_id", companyId)
      .eq("active", true)
      .eq("track_stock", true)
      .gt("min_stock", 0),
    supabase
      .from("quotes")
      .select("id, number, total, sent_at, customers(name, contact_name, phone_whatsapp)")
      .eq("company_id", companyId)
      .eq("status", "enviada")
      .lt("sent_at", threeDaysAgo)
      .order("sent_at"),
  ]);

  for (const r of [kpis, orders, technicians, materials, staleQuotes]) {
    if (r.error) throw new Error(`No se pudo cargar el inicio: ${r.error.message}`);
  }

  const todayOrders = orders.data ?? [];
  // Eventos de las órdenes de hoy de técnicos con una orden activa.
  const busy = new Set(
    todayOrders.filter((o) => o.status === "en_camino" || o.status === "en_proceso").map((o) => o.technician_id),
  );
  const activeIds = todayOrders.filter((o) => o.technician_id && busy.has(o.technician_id)).map((o) => o.id);
  const { data: events } = activeIds.length
    ? await supabase
        .from("work_order_events")
        .select("work_order_id, type, payload, user_id, created_at")
        .in("work_order_id", activeIds)
        .order("created_at")
    : { data: [] };

  // Último reporte de cada técnico en sus órdenes de hoy (los eventos del sistema no cuentan).
  const technicianOfOrder = new Map(todayOrders.map((o) => [o.id, o.technician_id]));
  const userOfTechnician = new Map((technicians.data ?? []).map((t) => [t.id, t.user_id]));
  const lastReport = new Map<string, string>();
  const startedAt = new Map<string, string>();
  for (const e of events ?? []) {
    const technician = technicianOfOrder.get(e.work_order_id);
    if (technician && e.user_id === userOfTechnician.get(technician)) lastReport.set(technician, e.created_at);
    const payload = e.payload as { a?: string } | null;
    if (e.type === "estado" && payload?.a === "en_proceso" && !startedAt.has(e.work_order_id)) {
      startedAt.set(e.work_order_id, e.created_at);
    }
  }

  // --- Técnicos ahora ---
  const technicianStatus = (technicians.data ?? []).map((t) => {
    const mine = todayOrders.filter((o) => o.technician_id === t.id);
    const active = mine.find((o) => o.status === "en_proceso") ?? mine.find((o) => o.status === "en_camino");
    let chip: ChipStatus = "disponible";
    let detail: string;

    if (active) {
      const report = lastReport.get(t.id);
      if (report && now.getTime() - new Date(report).getTime() > OFFLINE_AFTER_MS) {
        chip = "sin_conexion";
        detail = `Último reporte ${time(report)}`;
      } else if (active.status === "en_proceso") {
        chip = "en_proceso";
        const since = startedAt.get(active.id) ?? active.scheduled_start!;
        detail = `${orderCode(active.number)} · lleva ${duration(now.getTime() - new Date(since).getTime())}`;
      } else {
        chip = "en_camino";
        detail = `Hacia ${orderCode(active.number)} · llega ${time(active.scheduled_start)}`;
      }
    } else {
      const next = mine.find((o) => o.status === "asignada");
      detail = next
        ? `Siguiente: ${orderCode(next.number)} a las ${time(next.scheduled_start)}`
        : "Sin más órdenes hoy";
    }
    return { id: t.id, name: t.full_name, chip, detail };
  });

  // --- Requiere atención ---
  const late = todayOrders.filter(
    (o) =>
      (o.status === "pendiente" || o.status === "asignada") &&
      o.scheduled_start &&
      now.getTime() - new Date(o.scheduled_start).getTime() > LATE_AFTER_MS,
  );
  const lowStock = (materials.data ?? []).filter((m) => Number(m.stock) <= Number(m.min_stock));

  return {
    kpis: kpis.data as unknown as Kpis,
    todayOrders: todayOrders.map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status as WorkOrderStatus,
      customer: o.customers?.name ?? "—",
      neighborhood: o.sites?.neighborhood ?? null,
      service: o.service_types?.name ?? o.title,
      technician: o.memberships?.full_name ?? null,
      start: o.scheduled_start,
    })),
    technicianStatus,
    alerts: {
      late: late.map((o) => ({
        id: o.id,
        number: o.number,
        customer: o.customers?.name ?? "—",
        start: o.scheduled_start!,
        unassigned: !o.technician_id,
      })),
      lowStock: lowStock.map((m) => ({ id: m.id, name: m.name, unit: m.unit, stock: Number(m.stock), min: Number(m.min_stock) })),
      staleQuotes: (staleQuotes.data ?? []).map((q) => ({
        id: q.id,
        number: q.number,
        total: Number(q.total),
        sentAt: q.sent_at!,
        customer: q.customers?.name ?? "—",
        contact: q.customers?.contact_name ?? q.customers?.name ?? "",
        phone: q.customers?.phone_whatsapp ?? null,
      })),
    },
  };
}

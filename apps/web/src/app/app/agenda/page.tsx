import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { RealtimeRefresh } from "@/components/panel/realtime-refresh";
import { requireStaff } from "@/lib/session";
import { bogotaDateKey } from "@/lib/format";
import {
  addDays,
  dateKeyOf,
  dayLabel,
  isDateKey,
  isoAt,
  suggestTechnician,
  weekLabel,
  weekStart,
  type AgendaAbsence,
  type AgendaOrder,
  type AgendaTechnician,
  type AgendaView,
} from "@/lib/agenda";
import { AgendaBoard } from "./agenda-board";

export const metadata = { title: "Agenda · Tecnio" };

// Hasta qué fecha futura se calcula la carga para sugerir técnico a órdenes de otros días.
const SUGGEST_DAYS_AHEAD = 30;

type Row = {
  id: string;
  number: number;
  status: AgendaOrder["status"];
  title: string;
  technician_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  customers: { name: string } | null;
  sites: { neighborhood: string | null } | null;
  service_types: { name: string; skill: string | null; estimated_minutes: number } | null;
};

const ORDER_FIELDS =
  "id, number, status, title, technician_id, scheduled_start, scheduled_end, customers(name), sites(neighborhood), service_types(name, skill, estimated_minutes)";

function toOrder(r: Row): AgendaOrder {
  const durationMin =
    r.scheduled_start && r.scheduled_end
      ? Math.round((Date.parse(r.scheduled_end) - Date.parse(r.scheduled_start)) / 60_000)
      : (r.service_types?.estimated_minutes ?? 60);
  return {
    id: r.id,
    number: r.number,
    status: r.status,
    service: r.service_types?.name ?? r.title,
    customer: r.customers?.name ?? "—",
    neighborhood: r.sites?.neighborhood ?? null,
    technicianId: r.technician_id,
    start: r.scheduled_start,
    end: r.scheduled_end,
    skill: r.service_types?.skill ?? null,
    durationMin,
  };
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ fecha?: string; vista?: string }> }) {
  const { supabase, company } = await requireStaff();
  const params = await searchParams;
  const today = bogotaDateKey();
  const view: AgendaView = params.vista === "semana" ? "semana" : "dia";
  const date = isDateKey(params.fecha) ? params.fecha : today;
  const days = view === "dia" ? [date] : Array.from({ length: 7 }, (_, i) => addDays(weekStart(date), i));

  const [technicians, unassigned] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, full_name, skills")
      .eq("company_id", company.id)
      .eq("role", "technician")
      .eq("active", true)
      .order("full_name"),
    supabase
      .from("work_orders")
      .select(ORDER_FIELDS)
      .eq("company_id", company.id)
      .eq("status", "pendiente")
      .is("technician_id", null)
      .order("scheduled_start", { nullsFirst: false })
      .limit(50),
  ]);
  if (technicians.error || unassigned.error) throw new Error("No se pudo cargar la agenda.");

  const pending = (unassigned.data as Row[]).map(toOrder);

  // Rango a cargar: los días en pantalla y, para sugerir técnico, los días futuros de las pendientes.
  const horizon = addDays(today, SUGGEST_DAYS_AHEAD);
  const suggestDay = (o: AgendaOrder) => {
    const d = o.start ? dateKeyOf(o.start) : null;
    return d && d >= today && d <= horizon ? d : date;
  };
  const keys = [...days, ...pending.map(suggestDay)].sort();
  const from = isoAt(keys[0]!, 0);
  const to = isoAt(addDays(keys[keys.length - 1]!, 1), 0);

  const [orders, absences] = await Promise.all([
    supabase
      .from("work_orders")
      .select(ORDER_FIELDS)
      .eq("company_id", company.id)
      .not("technician_id", "is", null)
      .neq("status", "cancelada")
      .gte("scheduled_start", from)
      .lt("scheduled_start", to)
      .order("scheduled_start"),
    supabase
      .from("absences")
      .select("id, technician_id, starts_at, ends_at, reason")
      .eq("company_id", company.id)
      .lt("starts_at", to)
      .gt("ends_at", from),
  ]);
  if (orders.error || absences.error) throw new Error("No se pudo cargar la agenda.");

  const techs: AgendaTechnician[] = technicians.data.map((t) => ({ id: t.id, name: t.full_name, skills: t.skills }));
  const allOrders = (orders.data as Row[]).map(toOrder);
  const allAbsences: AgendaAbsence[] = absences.data.map((a) => ({
    id: a.id,
    technicianId: a.technician_id,
    start: a.starts_at,
    end: a.ends_at,
    reason: a.reason,
  }));

  const viewFrom = Date.parse(isoAt(days[0]!, 0));
  const viewTo = Date.parse(isoAt(addDays(days[days.length - 1]!, 1), 0));
  const inView = (start: string, end: string) => Date.parse(start) < viewTo && Date.parse(end) > viewFrom;

  const step = view === "dia" ? 1 : 7;
  const href = (d: string, v: AgendaView = view) => `/app/agenda?vista=${v}&fecha=${d}`;
  const tab = (active: boolean) =>
    `inline-flex h-9 items-center rounded-[8px] px-3.5 text-sm font-semibold ${active ? "bg-ink text-white" : "text-ink hover:bg-bg"}`;

  return (
    <>
      <RealtimeRefresh companyId={company.id} tables={["work_orders", "absences"]} />
      <PageHeader
        title="Agenda"
        description="Arrastra una orden a un técnico para asignarla. Él la recibe al instante en su celular."
        actions={
          <>
            <div role="group" aria-label="Vista" className="flex rounded-[10px] border border-line bg-surface p-[3px]">
              <Link href={href(date, "dia")} className={tab(view === "dia")} aria-current={view === "dia" ? "page" : undefined}>
                Día
              </Link>
              <Link href={href(date, "semana")} className={tab(view === "semana")} aria-current={view === "semana" ? "page" : undefined}>
                Semana
              </Link>
              <span aria-disabled className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 px-3.5 text-sm font-semibold text-muted">
                Mapa
                <span className="rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-semibold">Próximamente</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={href(addDays(date, -step))}
                aria-label={view === "dia" ? "Día anterior" : "Semana anterior"}
                className="btn-outline w-11 px-0"
              >
                <ChevronLeft size={18} aria-hidden />
              </Link>
              <span className="min-w-[110px] text-center font-display text-[15px] font-semibold" aria-live="polite">
                {view === "dia" ? dayLabel(date) : weekLabel(days[0]!)}
              </span>
              <Link
                href={href(addDays(date, step))}
                aria-label={view === "dia" ? "Día siguiente" : "Semana siguiente"}
                className="btn-outline w-11 px-0"
              >
                <ChevronRight size={18} aria-hidden />
              </Link>
            </div>
            <Link href="/app/ordenes/nueva" className="btn-accent">
              <Plus size={18} aria-hidden /> Nueva orden
            </Link>
          </>
        }
      />

      <AgendaBoard
        view={view}
        days={days}
        today={today}
        technicians={techs}
        orders={allOrders.filter((o) => inView(o.start!, o.end ?? o.start!))}
        absences={allAbsences.filter((a) => inView(a.start, a.end))}
        unassigned={pending.map((o) => ({
          ...o,
          suggested: suggestTechnician(o, techs, allOrders, allAbsences, suggestDay(o))?.name ?? null,
        }))}
      />
    </>
  );
}

import { TZ, type WorkOrderStatus } from "@/lib/format";

// La línea de tiempo va de 7:00 a 18:00 (11 columnas de hora) y ajusta a bloques de 15 minutos.
export const DAY_START = 7 * 60;
export const DAY_END = 18 * 60;
export const SPAN = DAY_END - DAY_START;
export const SNAP = 15;
export const HOURS = Array.from({ length: 11 }, (_, i) => 7 + i);

export type AgendaView = "dia" | "semana";

export type AgendaTechnician = { id: string; name: string; skills: string[] };

export type AgendaOrder = {
  id: string;
  number: number;
  status: WorkOrderStatus;
  service: string;
  customer: string;
  neighborhood: string | null;
  technicianId: string | null;
  start: string | null;
  end: string | null;
  skill: string | null;
  durationMin: number;
};

export type AgendaAbsence = { id: string; technicianId: string; start: string; end: string; reason: string };

const OFFSET_MS = 5 * 3_600_000; // Colombia es UTC-5 todo el año
const DAY_MS = 86_400_000;

// Minutos desde la medianoche de Bogotá.
export function minutesOfDay(iso: string): number {
  const d = new Date(new Date(iso).getTime() - OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

// "2026-10-15" + 870 → ISO de las 14:30 en Bogotá.
export function isoAt(dateKey: string, minutes: number): string {
  return new Date(new Date(`${dateKey}T00:00:00-05:00`).getTime() + minutes * 60_000).toISOString();
}

export function dateKeyOf(iso: string): string {
  return new Date(new Date(iso).getTime() - OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(dateKey: string, days: number): string {
  return new Date(new Date(`${dateKey}T12:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

// Lunes de la semana de esa fecha.
export function weekStart(dateKey: string): string {
  const dow = new Date(`${dateKey}T12:00:00Z`).getUTCDay(); // 0 = domingo
  return addDays(dateKey, -((dow + 6) % 7));
}

export const isDateKey = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));

const clean = (s: string) => s.replace(/\./g, "");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmt = (dateKey: string, opts: Intl.DateTimeFormatOptions) =>
  clean(new Intl.DateTimeFormat("es-CO", { ...opts, timeZone: TZ }).format(new Date(`${dateKey}T12:00:00-05:00`)));

// "Jue 15 oct"
export function dayLabel(dateKey: string): string {
  return cap(`${fmt(dateKey, { weekday: "short" })} ${fmt(dateKey, { day: "numeric" })} ${fmt(dateKey, { month: "short" })}`);
}

// "12 – 18 oct" o "28 sept – 4 oct"
export function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.slice(5, 7) === sunday.slice(5, 7);
  const from = sameMonth ? fmt(monday, { day: "numeric" }) : `${fmt(monday, { day: "numeric" })} ${fmt(monday, { month: "short" })}`;
  return `${from} – ${fmt(sunday, { day: "numeric" })} ${fmt(sunday, { month: "short" })}`;
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

export function absenceAt(absences: AgendaAbsence[], technicianId: string, start: string, end: string) {
  const s = Date.parse(start);
  const e = Date.parse(end);
  return absences.find((a) => a.technicianId === technicianId && overlaps(s, e, Date.parse(a.start), Date.parse(a.end)));
}

// Técnico sugerido para la orden en el día `day`: el que tiene la especialidad del tipo de servicio,
// no está ausente y tiene menos horas asignadas ese día. Si nadie tiene la especialidad, se considera a todos.
export function suggestTechnician(
  order: AgendaOrder,
  technicians: AgendaTechnician[],
  orders: AgendaOrder[],
  absences: AgendaAbsence[],
  day: string,
): AgendaTechnician | null {
  const fixed = order.start != null && dateKeyOf(order.start) === day;
  const start = fixed ? order.start! : isoAt(day, DAY_START);
  const end = fixed ? new Date(Date.parse(order.start!) + order.durationMin * 60_000).toISOString() : isoAt(day, DAY_END);

  const skilled = order.skill ? technicians.filter((t) => t.skills.includes(order.skill!)) : [];
  const pool = (skilled.length ? skilled : technicians).filter((t) => {
    const away = absenceAt(absences, t.id, start, end);
    // Sin hora fija solo descarta a quien falta toda la jornada.
    return !away || (!fixed && !(Date.parse(away.start) <= Date.parse(start) && Date.parse(away.end) >= Date.parse(end)));
  });

  const load = (t: AgendaTechnician) =>
    orders
      .filter((o) => o.technicianId === t.id && o.status !== "cancelada" && o.start && dateKeyOf(o.start) === day)
      .reduce((sum, o) => sum + o.durationMin, 0);

  return pool.map((t) => ({ t, load: load(t) })).sort((a, b) => a.load - b.load || a.t.name.localeCompare(b.t.name))[0]?.t ?? null;
}

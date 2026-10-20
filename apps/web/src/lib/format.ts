import type { Database } from "@tecnio/db";

export type WorkOrderStatus = Database["public"]["Enums"]["work_order_status"];
export type WorkOrderPriority = Database["public"]["Enums"]["work_order_priority"];
export type MemberRole = Database["public"]["Enums"]["member_role"];

export const TZ = "America/Bogota";

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pendiente: "Pendiente",
  asignada: "Asignada",
  en_camino: "En camino",
  en_proceso: "En proceso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const PRIORITY_LABELS: Record<WorkOrderPriority, string> = { baja: "Baja", normal: "Normal", alta: "Alta" };

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Dueño",
  dispatcher: "Despachador",
  technician: "Técnico",
};

export const orderCode = (n: number) => `OT-${n}`;
export const quoteCode = (n: number) => `COT-${n}`;

// $3.284.000 (punto de miles, sin decimales)
export function cop(value: number | string | null | undefined): string {
  return `$${Math.round(Number(value ?? 0)).toLocaleString("es-CO")}`;
}

// $38,4 M
export function copMillions(value: number | string): string {
  // Menos de un millón se muestra completo ("$0", "$850.000"), no "$0 M".
  if (Math.abs(Number(value)) < 1_000_000) return cop(value);
  const millions = Number(value) / 1_000_000;
  return `$${millions.toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// "Jueves, 15 de octubre"
export function longDate(date: Date | string): string {
  const s = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(
    new Date(date),
  );
  return capitalize(s);
}

// "15 oct"
export function shortDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: TZ })
    .format(new Date(date))
    .replace(".", "")
    .replace(" de ", " ");
}

// "9:30", "14:30" (24 h)
export function time(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).format(
    new Date(date),
  );
}

// "1 h 10 min"
export function duration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Fecha de hoy en Bogotá como "2026-10-15".
export function bogotaDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
}

// Inicio y fin del día en Bogotá (Colombia es UTC-5 todo el año).
export function bogotaDayRange(dateKey: string = bogotaDateKey()) {
  const start = new Date(`${dateKey}T00:00:00-05:00`);
  return { start: start.toISOString(), end: new Date(start.getTime() + 86_400_000).toISOString() };
}

// "2026-10-15" + "14:30" → ISO en UTC
export function bogotaToIso(dateKey: string, hhmm: string): string {
  return new Date(`${dateKey}T${hhmm}:00-05:00`).toISOString();
}

export function bogotaHour(date: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: TZ }).format(date));
}

export function greeting(date: Date = new Date()): string {
  const h = bogotaHour(date);
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

// Acepta "300 111 2233", "+57 300..." o "57300..." y devuelve "573001112233".
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length === 10 ? `57${digits}` : digits;
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const d = phone.startsWith("57") && phone.length === 12 ? phone.slice(2) : phone;
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : phone;
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function directionsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function wazeLink(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

// Saca lat/lng de un enlace de Google Maps o de "4.65, -74.06". Los enlaces cortos
// (maps.app.goo.gl) no traen coordenadas: hay que abrirlos y copiar el enlace largo.
export function parseCoordinates(input: string): { lat: number; lng: number } | null {
  let text = input.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // texto con % sueltos: se usa tal cual
  }
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|query|destination|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
    /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export type FormState = { error?: string; ok?: boolean; message?: string } | null;

// Cantidades: "12", "2,5"
export function qty(value: number | string | null | undefined): string {
  return Number(value ?? 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

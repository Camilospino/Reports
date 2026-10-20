// Formatos de Colombia sin depender de Intl (Hermes en Android no siempre trae zonas horarias).
// Colombia es UTC-5 todo el año.
const OFFSET = 5 * 3_600_000;
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const bogota = (d: Date | string) => new Date(new Date(d).getTime() - OFFSET);

// $3.284.000
export function cop(value: number | string | null | undefined): string {
  const n = Math.round(Number(value) || 0);
  return `${n < 0 ? "-" : ""}$${Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

// 9:30, 14:05 (24 h)
export function time(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const b = bogota(d);
  return `${b.getUTCHours()}:${String(b.getUTCMinutes()).padStart(2, "0")}`;
}

// "Jueves, 15 de octubre"
export function longDate(d: Date | string = new Date()): string {
  const b = bogota(d);
  const s = `${DAYS[b.getUTCDay()]}, ${b.getUTCDate()} de ${MONTHS[b.getUTCMonth()]}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// "15 oct"
export function shortDate(d: Date | string): string {
  const b = bogota(d);
  return `${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]!.slice(0, 3)}`;
}

// "2026-10-15" (día en Bogotá)
export function dateKey(d: Date | string = new Date()): string {
  return bogota(d).toISOString().slice(0, 10);
}

export function dayRange(key: string = dateKey()) {
  const start = new Date(`${key}T00:00:00-05:00`);
  return { start: start.toISOString(), end: new Date(start.getTime() + 86_400_000).toISOString() };
}

// "1 h 10 min"
export function duration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// "3,5 h"
export function hours(ms: number): string {
  const h = Math.round((ms / 3_600_000) * 10) / 10;
  return `${h.toString().replace(".", ",")} h`;
}

export const orderCode = (n: number) => `OT-${n}`;

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length === 10 ? `57${digits}` : digits;
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const d = phone.startsWith("57") && phone.length === 12 ? phone.slice(2) : phone;
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : phone;
}

export const whatsappLink = (phone: string, message: string) =>
  `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
export const directionsLink = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
export const wazeLink = (lat: number, lng: number) => `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function reportMessage(contact: string, url: string): string {
  return `Hola ${contact}, terminamos el servicio. Aquí está tu reporte con fotos y firma: ${url}`;
}

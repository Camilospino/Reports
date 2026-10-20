import "server-only";
import { headers } from "next/headers";
import { time } from "@/lib/format";

// Dirección pública del panel para armar enlaces que salen por WhatsApp.
export async function siteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:4000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export type NoticeKind = "en_camino" | "reporte";

type NoticeData = {
  contact: string;
  technician: string | null;
  company: string;
  start: string | null;
  reportUrl: string | null;
};

// Textos de los avisos al cliente (Prompt 5).
export function noticeText(kind: NoticeKind, d: NoticeData, now = new Date()): string | null {
  if (kind === "en_camino") {
    const eta = d.start && Date.parse(d.start) > now.getTime() ? d.start : new Date(now.getTime() + 30 * 60_000).toISOString();
    return `Hola ${d.contact}, ${d.technician ?? "nuestro técnico"} de ${d.company} va en camino. Llega aprox. ${time(eta)}.`;
  }
  if (!d.reportUrl) return null;
  return `Hola ${d.contact}, terminamos el servicio. Aquí está tu reporte con fotos y firma: ${d.reportUrl}`;
}

export function quoteText(contact: string, company: string, number: number, url: string): string {
  return `Hola ${contact}, te comparto la cotización COT-${number} de ${company}: ${url}`;
}

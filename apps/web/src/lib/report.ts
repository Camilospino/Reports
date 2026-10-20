import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Reporte público de una orden completada (/r/[token]). Todo sale de public_report(),
// que solo responde con el token correcto; nunca se leen las tablas como anónimo.

type Kind = "foto_antes" | "foto_despues" | "firma";

export type ReportPayment = {
  nequi: string | null;
  bank: string | null;
  account_type: "ahorros" | "corriente" | null;
  account_number: string | null;
  holder: string | null;
  holder_id: string | null;
  notes: string | null;
};

export type ReportData = {
  number: number;
  title: string;
  completed_at: string;
  started_at: string | null;
  observations: string | null;
  checklist: { label: string; done: boolean }[];
  signer_name: string | null;
  total: number | string;
  company: { name: string; nit: string | null; logo_url: string | null; phone: string | null; payment: ReportPayment };
  customer: string;
  neighborhood: string | null;
  city: string | null;
  service_type: string | null;
  warranty_months: number | null;
  technician: string | null;
  items: { description: string; quantity: number | string; unit_price: number | string; total: number | string; is_material: boolean }[];
  attachments: { id: string; kind: Kind; caption: string | null; path: string }[];
  rating: { stars: number; comment: string | null; can_comment: boolean } | null;
};

export const isReportToken = (t: string) => /^[0-9a-f]{32}$/.test(t);

export const loadReport = cache(async (token: string): Promise<ReportData | null> => {
  if (!isReportToken(token)) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_report", { p_token: token });
  return (data as unknown as ReportData | null) ?? null;
});

// Fotos para el cliente: primero las de antes, luego las de después. La firma va aparte.
export function reportPhotos(r: ReportData) {
  const label = (k: Kind) => (k === "foto_antes" ? "Antes" : "Después");
  return [...r.attachments.filter((a) => a.kind === "foto_antes"), ...r.attachments.filter((a) => a.kind === "foto_despues")].map(
    (a) => ({ id: a.id, kind: a.kind as Exclude<Kind, "firma">, caption: a.caption ? `${label(a.kind)} · ${a.caption}` : label(a.kind) }),
  );
}

export const reportSignature = (r: ReportData) => r.attachments.findLast((a) => a.kind === "firma") ?? null;

export function reportTotals(r: ReportData) {
  const sum = (material: boolean) =>
    r.items.filter((i) => i.is_material === material).reduce((acc, i) => acc + Number(i.total), 0);
  return { materials: sum(true), labor: sum(false), total: Number(r.total) };
}

// Fecha fin de la garantía, contada desde el cierre.
export function warrantyEnd(r: ReportData): Date | null {
  if (!r.warranty_months) return null;
  const d = new Date(r.completed_at);
  d.setUTCMonth(d.getUTCMonth() + r.warranty_months);
  return d;
}

// Bytes de un archivo del reporte. Solo se llama con rutas que devolvió public_report()
// para ese token; la llave secreta se queda en el servidor.
export async function downloadAttachment(path: string): Promise<Blob | null> {
  const { data } = await createAdminClient().storage.from("evidencias").download(path);
  return data ?? null;
}

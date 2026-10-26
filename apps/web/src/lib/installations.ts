import type { Database } from "@tecnio/db";
import { bogotaDateKey } from "@/lib/format";

export type InstallationStatus = Database["public"]["Enums"]["installation_status"];
export type InstallationSystem = Database["public"]["Enums"]["installation_system"];
export type AssetStatus = Database["public"]["Enums"]["asset_status"];

// Bucket privado de Storage. Ruta: {company_id}/{installation_id}/{archivo}
export const INSTALLATION_BUCKET = "instalaciones";

// Colores de las etiquetas: siempre con texto, nunca solo color.
export const TONES = {
  green: { bg: "#E3EFEB", fg: "#0E5A4A" },
  amber: { bg: "#FDF1DC", fg: "#8A5300" },
  red: { bg: "#F6E3E3", fg: "#9B1C1C" },
  blue: { bg: "#E4ECFA", fg: "#1F4FA8" },
  gray: { bg: "#ECEFEE", fg: "#46534F" },
} as const;
export type Tone = keyof typeof TONES;

export const SYSTEM_LABELS: Record<InstallationSystem, string> = {
  cctv: "CCTV",
  alarma: "Alarma",
  red: "Red",
  acceso: "Control de acceso",
  aire: "Aire acondicionado",
  otro: "Otro",
};

export const ASSET_STATUS: Record<AssetStatus, { label: string; tone: Tone }> = {
  funcionando: { label: "Funcionando", tone: "green" },
  con_falla: { label: "Con falla", tone: "red" },
  retirado: { label: "Retirado", tone: "gray" },
};

// Días antes del vencimiento en que la garantía se marca "por vencer".
export const WARRANTY_SOON_DAYS = 30;

// Días de "hoy" a una fecha "2026-11-12" (negativo si ya pasó), en Bogotá.
export function daysUntil(key: string, today: string = bogotaDateKey()): number {
  return Math.round((Date.parse(key) - Date.parse(today)) / 86_400_000);
}

export type WarrantyState =
  | { kind: "none" }
  | { kind: "ok" | "soon"; days: number }
  | { kind: "expired"; days: number };

export function warrantyState(until: string | null, today: string = bogotaDateKey()): WarrantyState {
  if (!until) return { kind: "none" };
  const days = daysUntil(until, today);
  if (days < 0) return { kind: "expired", days };
  return { kind: days <= WARRANTY_SOON_DAYS ? "soon" : "ok", days };
}

// Etiqueta del encabezado y de la lista. Orden: retirada > con falla > garantía por vencer > activa.
// Una garantía ya vencida no cambia la etiqueta: el aviso de la página lo muestra.
export function installationBadge(
  installation: { status: InstallationStatus; warranty_until: string | null },
  assets: { status: AssetStatus }[],
  today: string = bogotaDateKey(),
): { label: string; tone: Tone } {
  if (installation.status === "retirada") return { label: "Retirada", tone: "gray" };
  if (assets.some((a) => a.status === "con_falla")) return { label: "Con falla", tone: "red" };
  if (warrantyState(installation.warranty_until, today).kind === "soon") return { label: "Garantía por vencer", tone: "amber" };
  return { label: "Activa", tone: "green" };
}

// Porcentaje del tiempo de garantía que ya pasó (0 a 100) y su color.
export function warrantyProgress(installedOn: string, until: string, today: string = bogotaDateKey()) {
  const total = daysUntil(until, installedOn);
  const elapsed = daysUntil(today, installedOn);
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 100;
  const state = warrantyState(until, today).kind;
  const tone: Tone = state === "expired" ? "red" : state === "soon" ? "amber" : "green";
  return { percent, tone };
}

export function maintenanceFrequency(months: number | null): string {
  if (!months) return "Sin plan";
  if (months === 1) return "Cada mes";
  if (months === 12) return "Cada año";
  return `Cada ${months} meses`;
}

// "1 día", "18 días"
export const daysText = (n: number) => `${n} ${Math.abs(n) === 1 ? "día" : "días"}`;

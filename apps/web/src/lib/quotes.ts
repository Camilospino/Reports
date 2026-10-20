import type { Database } from "@tecnio/db";

export type QuoteStatus = Database["public"]["Enums"]["quote_status"];
export type QuoteItem = { material_id?: string | null; description: string; quantity: number; unit_price: number };

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; bg: string; fg: string }> = {
  borrador: { label: "Borrador", bg: "#ECEFEE", fg: "#46534F" },
  enviada: { label: "Enviada", bg: "#E4ECFA", fg: "#1F4FA8" },
  aprobada: { label: "Aprobada", bg: "#E3EFEB", fg: "#0E5A4A" },
  rechazada: { label: "Rechazada", bg: "#F6E3E3", fg: "#9B1C1C" },
};

// Los ítems vienen como jsonb: se limpian antes de mostrarlos.
export function parseItems(raw: unknown): QuoteItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i): i is Record<string, unknown> => typeof i === "object" && i !== null)
    .map((i) => ({
      material_id: typeof i.material_id === "string" ? i.material_id : null,
      description: String(i.description ?? ""),
      quantity: Number(i.quantity) || 0,
      unit_price: Number(i.unit_price) || 0,
    }));
}

export const itemTotal = (i: QuoteItem) => Math.round(i.quantity * i.unit_price * 100) / 100;
export const quoteTotal = (items: QuoteItem[]) => items.reduce((s, i) => s + itemTotal(i), 0);

import { STATUS_LABELS, type WorkOrderStatus } from "@/lib/format";

// Colores de estado: siempre con texto, nunca solo color.
const STYLES = {
  pendiente: { bg: "#ECEFEE", fg: "#46534F" },
  asignada: { bg: "#E4ECFA", fg: "#1F4FA8" },
  en_camino: { bg: "#FDEBDF", fg: "#A33A0B" },
  en_proceso: { bg: "#E3EFEB", fg: "#0E5A4A" },
  completada: { bg: "#10211C", fg: "#FFFFFF" },
  cancelada: { bg: "#F6E3E3", fg: "#9B1C1C" },
  // Estados de técnico (no son de una orden)
  disponible: { bg: "#E4ECFA", fg: "#1F4FA8" },
  sin_conexion: { bg: "#F6E3E3", fg: "#9B1C1C" },
} as const;

export type ChipStatus = keyof typeof STYLES;

const EXTRA_LABELS: Record<string, string> = { disponible: "Disponible", sin_conexion: "Sin conexión" };

export function StatusChip({ status, label, size = "md" }: { status: ChipStatus; label?: string; size?: "md" | "lg" }) {
  const { bg, fg } = STYLES[status];
  const text = label ?? STATUS_LABELS[status as WorkOrderStatus] ?? EXTRA_LABELS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${
        size === "lg" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      }`}
      style={{ background: bg, color: fg }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: fg }} />
      {text}
    </span>
  );
}

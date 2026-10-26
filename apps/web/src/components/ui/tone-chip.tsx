import { TONES, type Tone } from "@/lib/installations";

// Etiqueta de color con punto (mismo dibujo que StatusChip) para estados que no son de una orden.
export function ToneChip({ tone, children, size = "md" }: { tone: Tone; children: React.ReactNode; size?: "md" | "lg" }) {
  const { bg, fg } = TONES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${
        size === "lg" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      }`}
      style={{ background: bg, color: fg }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: fg }} />
      {children}
    </span>
  );
}

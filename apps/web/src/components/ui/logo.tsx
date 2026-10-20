import { Wrench } from "lucide-react";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="inline-flex size-[34px] items-center justify-center rounded-[9px] bg-accent">
        <Wrench size={18} strokeWidth={2} color="#FFFFFF" aria-hidden />
      </span>
      <span className={`font-display text-[22px] font-bold tracking-[-0.02em] ${dark ? "text-ink" : "text-white"}`}>
        tecnio
      </span>
    </span>
  );
}

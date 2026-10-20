import { QUOTE_STATUS, type QuoteStatus } from "@/lib/quotes";

export function QuoteChip({ status }: { status: QuoteStatus }) {
  const { label, bg, fg } = QUOTE_STATUS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: fg }} />
      {label}
    </span>
  );
}

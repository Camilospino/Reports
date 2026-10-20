"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { toggleChecklistItem } from "./actions";

type Item = { label: string; done: boolean };

export function Checklist({ orderId, items, editable }: { orderId: string; items: Item[]; editable: boolean }) {
  const [list, setOptimistic] = useOptimistic(items, (state, { index, done }: { index: number; done: boolean }) =>
    state.map((c, i) => (i === index ? { ...c, done } : c)),
  );
  const [, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const done = list.filter((c) => c.done).length;

  return (
    <SectionCard title={`Lista de chequeo · ${done} de ${list.length}`}>
      {list.length === 0 ? (
        <p className="text-sm text-muted">Esta orden no tiene lista de chequeo.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {list.map((c, i) => (
            <li key={i}>
              <label
                className={`flex min-h-11 items-center gap-3 rounded-[10px] border border-line-soft px-3 text-sm ${
                  editable ? "cursor-pointer hover:border-line" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={c.done}
                  disabled={!editable}
                  onChange={(e) => {
                    const value = e.target.checked;
                    start(async () => {
                      setError(null);
                      setOptimistic({ index: i, done: value });
                      const r = await toggleChecklistItem(orderId, i, value);
                      if (r.error) setError(r.error);
                    });
                  }}
                />
                <span
                  aria-hidden
                  className={`inline-flex size-5 shrink-0 items-center justify-center rounded-[6px] border peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${
                    c.done ? "border-primary bg-primary text-white" : "border-line"
                  }`}
                >
                  {c.done && <Check size={14} strokeWidth={3} />}
                </span>
                <span className={c.done ? "text-muted line-through decoration-line" : ""}>{c.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#9B1C1C]">
          {error}
        </p>
      )}
    </SectionCard>
  );
}

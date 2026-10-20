"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { scheduleOrder } from "@/app/app/agenda/actions";
import { bogotaToIso } from "@/lib/format";
import { invoiceOrder, quoteFromOrder } from "./actions";

type Props = {
  orderId: string;
  canReassign: boolean;
  canInvoice: boolean;
  invoiced: boolean;
  technicians: { id: string; full_name: string }[];
  technicianId: string | null;
  date: string;
  time: string;
};

// Botones del encabezado: Reasignar, Generar cotización y Facturar.
export function OrderActions(p: Props) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string } | undefined>, after?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r?.error) setError(r.error);
      else {
        after?.();
        router.refresh();
      }
    });

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          className="btn-outline"
          disabled={!p.canReassign || pending}
          title={p.canReassign ? undefined : "Solo se reasignan órdenes pendientes o asignadas"}
          onClick={() => dialog.current?.showModal()}
        >
          Reasignar
        </button>
        <button type="button" className="btn-outline" disabled={pending} onClick={() => run(() => quoteFromOrder(p.orderId))}>
          Generar cotización
        </button>
        <button
          type="button"
          className="btn-dark"
          disabled={!p.canInvoice || pending}
          title={p.invoiced ? "Esta orden ya está facturada" : p.canInvoice ? undefined : "Se factura cuando la orden esté completada"}
          onClick={() => {
            if (confirm("¿Marcar esta orden como facturada? Después no se pueden cambiar sus materiales.")) run(() => invoiceOrder(p.orderId));
          }}
        >
          {p.invoiced ? "Facturada" : "Facturar"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-[#9B1C1C]">
          {error}
        </p>
      )}

      <dialog
        ref={dialog}
        aria-labelledby="reasignar-titulo"
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[14px] border border-line bg-surface p-0 text-ink backdrop:bg-ink/40"
      >
        <form
          className="grid gap-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const technicianId = String(fd.get("technician_id"));
            const start = bogotaToIso(String(fd.get("date")), String(fd.get("time")));
            run(
              () => scheduleOrder({ orderId: p.orderId, technicianId, start }),
              () => dialog.current?.close(),
            );
          }}
        >
          <div className="flex items-center justify-between">
            <h2 id="reasignar-titulo" className="font-display text-lg font-bold">
              Reasignar orden
            </h2>
            <button type="button" aria-label="Cerrar" className="cursor-pointer" onClick={() => dialog.current?.close()}>
              <X size={18} aria-hidden />
            </button>
          </div>
          <div>
            <label className="label" htmlFor="r-tech">
              Técnico
            </label>
            <select id="r-tech" name="technician_id" className="input" defaultValue={p.technicianId ?? ""} required>
              <option value="" disabled>
                Escoge un técnico
              </option>
              {p.technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="r-date">
                Fecha
              </label>
              <input id="r-date" name="date" type="date" className="input" defaultValue={p.date} required />
            </div>
            <div>
              <label className="label" htmlFor="r-time">
                Hora
              </label>
              <input id="r-time" name="time" type="time" step={900} className="input" defaultValue={p.time} required />
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-[#9B1C1C]">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2.5">
            <button type="button" className="btn-outline" onClick={() => dialog.current?.close()}>
              Cancelar
            </button>
            <button className="btn-primary" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { CustomerCombobox } from "@/components/ui/customer-combobox";
import { SectionCard } from "@/components/ui/section-card";
import { cop, orderCode, whatsappLink } from "@/lib/format";
import { QUOTE_STATUS, itemTotal, quoteTotal, type QuoteItem, type QuoteStatus } from "@/lib/quotes";
import { convertQuote, deleteQuote, saveQuote, setQuoteStatus } from "./actions";

type Customer = { id: string; name: string; contact_name: string | null; phone_whatsapp: string | null };
type Material = { id: string; name: string; unit: string; unit_price: number };

type Props = {
  quote: {
    id: string;
    status: QuoteStatus;
    customer_id: string;
    items: QuoteItem[];
    valid_until: string | null;
    notes: string | null;
    shareText: string | null; // mensaje de WhatsApp con el enlace público
    workOrder: { id: string; number: number } | null;
  } | null;
  customers: Customer[];
  materials: Material[];
  defaultValidUntil: string;
  initialCustomerId?: string;
  initialNotes?: string;
};

const blank = (): QuoteItem => ({ material_id: null, description: "", quantity: 1, unit_price: 0 });

export function QuoteEditor({ quote, customers, materials, defaultValidUntil, initialCustomerId, initialNotes }: Props) {
  const router = useRouter();
  const editable = !quote || quote.status === "borrador" || quote.status === "enviada";
  const [customerId, setCustomerId] = useState(quote?.customer_id ?? initialCustomerId ?? "");
  const [items, setItems] = useState<QuoteItem[]>(quote?.items.length ? quote.items : [blank()]);
  const [validUntil, setValidUntil] = useState(quote?.valid_until ?? defaultValidUntil);
  const [notes, setNotes] = useState(quote?.notes ?? initialNotes ?? "");
  const [dirty, setDirty] = useState(!quote);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const customer = customers.find((c) => c.id === customerId);
  // Los campos guardan el texto que se escribe ("1,5" → "1.5"); los cálculos usan números.
  const numeric = items.map((i) => ({ ...i, quantity: Number(i.quantity) || 0, unit_price: Number(i.unit_price) || 0 }));
  const total = quoteTotal(numeric);
  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setDirty(true);
    setSaved(false);
  };
  const setItem = (i: number, patch: Partial<QuoteItem>) => change(setItems)(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const run = (fn: () => Promise<{ error?: string } | undefined>, onOk?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r?.error) setError(r.error);
      else {
        onOk?.();
        router.refresh();
      }
    });

  const save = () =>
    run(
      () =>
        saveQuote(quote?.id ?? null, {
          customer_id: customerId,
          valid_until: validUntil || null,
          notes: notes || null,
          items: numeric,
        }),
      () => {
        setDirty(false);
        setSaved(true);
      },
    );

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex min-w-0 flex-[1_1_600px] flex-col gap-6">
        <section className="card grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="q-customer">
              Cliente
            </label>
            {editable ? (
              <CustomerCombobox
                id="q-customer"
                customers={customers.map((c) => ({ id: c.id, name: c.name, detail: c.contact_name }))}
                value={customerId}
                onChange={(v) => change(setCustomerId)(v)}
                required
              />
            ) : (
              <p className="font-semibold">{customer?.name}</p>
            )}
            {editable && customers.length === 0 && (
              <p className="mt-2 text-sm text-muted">
                Aún no tienes clientes. Se crean al hacer una{" "}
                <Link href="/app/ordenes/nueva" className="link">
                  nueva orden
                </Link>
                ; después podrás cotizarles aquí.
              </p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="q-valid">
              Válida hasta
            </label>
            <input
              id="q-valid"
              type="date"
              className="input"
              value={validUntil}
              disabled={!editable}
              onChange={(e) => change(setValidUntil)(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="q-notes">
              Descripción del trabajo <span className="font-normal text-muted">(opcional)</span>
            </label>
            <textarea
              id="q-notes"
              rows={2}
              className="textarea"
              value={notes}
              disabled={!editable}
              placeholder="Instalación de 8 cámaras en la sede principal"
              onChange={(e) => change(setNotes)(e.target.value)}
            />
          </div>
        </section>

        <SectionCard title="Ítems" bodyClassName="px-2 pt-3 pb-2">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th className="th">Ítem</th>
                  <th className="th w-24 text-right">Cant.</th>
                  <th className="th w-36 text-right">Valor unit.</th>
                  <th className="th w-32 text-right">Total</th>
                  {editable && (
                    <th className="th w-12">
                      <span className="sr-only">Quitar</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td className="td">
                      {editable ? (
                        <div className="grid gap-1.5">
                          <label className="sr-only" htmlFor={`q-mat-${i}`}>
                            Del catálogo, ítem {i + 1}
                          </label>
                          <select
                            id={`q-mat-${i}`}
                            className="input h-9"
                            value={it.material_id ?? ""}
                            onChange={(e) => {
                              const m = materials.find((x) => x.id === e.target.value);
                              setItem(i, m ? { material_id: m.id, description: m.name, unit_price: m.unit_price } : { material_id: null });
                            }}
                          >
                            <option value="">Ítem libre</option>
                            {materials.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} · {cop(m.unit_price)}/{m.unit}
                              </option>
                            ))}
                          </select>
                          <label className="sr-only" htmlFor={`q-desc-${i}`}>
                            Descripción, ítem {i + 1}
                          </label>
                          <input
                            id={`q-desc-${i}`}
                            className="input h-9"
                            value={it.description}
                            placeholder="Mano de obra"
                            onChange={(e) => setItem(i, { description: e.target.value })}
                          />
                        </div>
                      ) : (
                        it.description
                      )}
                    </td>
                    <td className="td text-right">
                      {editable ? (
                        <input
                          aria-label={`Cantidad, ítem ${i + 1}`}
                          className="input h-9 text-right"
                          inputMode="decimal"
                          value={it.quantity}
                          onChange={(e) => setItem(i, { quantity: e.target.value.replace(",", ".") as unknown as number })}
                        />
                      ) : (
                        <span className="font-display tabular">{it.quantity.toLocaleString("es-CO")}</span>
                      )}
                    </td>
                    <td className="td text-right">
                      {editable ? (
                        <input
                          aria-label={`Valor unitario, ítem ${i + 1}`}
                          className="input h-9 text-right"
                          inputMode="numeric"
                          value={it.unit_price}
                          onChange={(e) => setItem(i, { unit_price: e.target.value.replace(/[^\d.]/g, "") as unknown as number })}
                        />
                      ) : (
                        <span className="font-display tabular">{cop(it.unit_price)}</span>
                      )}
                    </td>
                    <td className="td font-display tabular text-right">
                      {cop(itemTotal(numeric[i]!))}
                    </td>
                    {editable && (
                      <td className="td">
                        <button
                          type="button"
                          aria-label={`Quitar ítem ${i + 1}`}
                          className="btn h-9 w-9 px-0 text-muted hover:bg-bg hover:text-[#9B1C1C]"
                          disabled={items.length === 1}
                          onClick={() => change(setItems)(items.filter((_, j) => j !== i))}
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="border-t-2 border-ink px-3 py-3 font-semibold">
                    Total (IVA incluido)
                  </td>
                  <td className="font-display tabular border-t-2 border-ink px-3 py-3 text-right text-lg font-bold">
                    {cop(total)}
                  </td>
                  {editable && <td className="border-t-2 border-ink" />}
                </tr>
              </tbody>
            </table>
          </div>
          {editable && (
            <button type="button" className="link mx-3 my-2 inline-flex items-center gap-1.5 text-sm" onClick={() => change(setItems)([...items, blank()])}>
              <Plus size={16} aria-hidden /> Agregar ítem
            </button>
          )}
        </SectionCard>
      </div>

      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 xl:max-w-[320px]">
        <section className="card grid gap-3">
          {quote && (
            <p className="flex items-center justify-between text-sm">
              <span className="text-muted">Estado</span>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: QUOTE_STATUS[quote.status].bg, color: QUOTE_STATUS[quote.status].fg }}
              >
                {QUOTE_STATUS[quote.status].label}
              </span>
            </p>
          )}
          <p className="flex items-baseline justify-between">
            <span className="text-sm text-muted">Total</span>
            <span className="font-display tabular text-2xl font-bold">{cop(total)}</span>
          </p>

          {editable && (
            <button type="button" className="btn-primary w-full" disabled={pending || !dirty} onClick={save}>
              {pending ? "Guardando…" : quote ? (dirty ? "Guardar cambios" : "Guardado") : "Crear cotización"}
            </button>
          )}
          {saved && !dirty && (
            <p role="status" className="text-center text-xs text-muted">
              Cambios guardados.
            </p>
          )}

          {quote && (
            <>
              {dirty && <p className="text-xs text-muted">Guarda los cambios antes de descargar o enviar.</p>}
              <a
                href={`/app/cotizaciones/${quote.id}/pdf`}
                className={`btn-outline w-full ${dirty ? "pointer-events-none opacity-60" : ""}`}
                aria-disabled={dirty}
              >
                <Download size={16} aria-hidden /> Descargar PDF
              </a>
              <button
                type="button"
                className="btn-outline w-full"
                disabled={dirty || pending || !customer?.phone_whatsapp || !quote.shareText || !editable}
                title={!customer?.phone_whatsapp ? "El cliente no tiene WhatsApp registrado" : undefined}
                onClick={() => {
                  window.open(whatsappLink(customer!.phone_whatsapp!, quote.shareText!), "_blank", "noopener,noreferrer");
                  run(() => setQuoteStatus(quote.id, "enviada"));
                }}
              >
                <MessageCircle size={16} aria-hidden /> Enviar por WhatsApp
              </button>
              {!customer?.phone_whatsapp && <p className="text-xs text-muted">El cliente no tiene WhatsApp registrado.</p>}
            </>
          )}
        </section>

        {quote && quote.status !== "borrador" && (
          <section className="card grid gap-3">
            <h2 className="font-display text-base font-bold">Respuesta del cliente</h2>
            {quote.status === "aprobada" ? (
              quote.workOrder ? (
                <Link href={`/app/ordenes/${quote.workOrder.id}`} className="btn-outline w-full">
                  Ver orden {orderCode(quote.workOrder.number)}
                </Link>
              ) : (
                <button type="button" className="btn-accent w-full" disabled={pending} onClick={() => run(() => convertQuote(quote.id))}>
                  Convertir en orden
                </button>
              )
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn-outline" disabled={pending || dirty} onClick={() => run(() => setQuoteStatus(quote.id, "aprobada"))}>
                  <Check size={16} aria-hidden /> Aprobada
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={pending || dirty || quote.status === "rechazada"}
                  onClick={() => run(() => setQuoteStatus(quote.id, "rechazada"))}
                >
                  <X size={16} aria-hidden /> Rechazada
                </button>
              </div>
            )}
          </section>
        )}

        {quote?.status === "borrador" && (
          <button
            type="button"
            className="self-start text-sm text-[#9B1C1C] hover:underline"
            onClick={() => confirm("¿Borrar este borrador?") && run(() => deleteQuote(quote.id))}
          >
            Borrar borrador
          </button>
        )}
        {error && (
          <p role="alert" className="text-sm text-[#9B1C1C]">
            {error}
          </p>
        )}
      </aside>
    </div>
  );
}

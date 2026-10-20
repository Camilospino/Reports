import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { QuoteChip } from "@/components/ui/quote-chip";
import { createClient } from "@/lib/supabase/server";
import { cop, formatPhone, initials, longDate, quoteCode } from "@/lib/format";
import { itemTotal, parseItems, type QuoteStatus } from "@/lib/quotes";
import type { QuotePdfData } from "@/lib/quote-pdf";

export const metadata: Metadata = { title: "Cotización", robots: { index: false, follow: false } };

const day = (d: string) => longDate(d.length === 10 ? `${d}T12:00:00-05:00` : d);

// Página pública de la cotización: sin sesión, solo lo que devuelve public_quote().
export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{32}$/.test(token)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_quote", { p_token: token });
  if (!data) notFound();
  const q = data as unknown as QuotePdfData & { status: QuoteStatus };
  const items = parseItems(q.items);

  return (
    <main className="mx-auto min-h-screen max-w-[480px] bg-surface pb-10">
      <header className="flex items-center gap-3 border-b border-line bg-bg px-5 py-4">
        {q.company.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo externo de la empresa
          <img src={q.company.logo_url} alt="" className="size-10 rounded-[10px] object-contain" />
        ) : (
          <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-[10px] bg-ink font-display font-bold text-white">
            {initials(q.company.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display font-bold">{q.company.name}</p>
          {q.company.nit && <p className="text-xs text-muted">NIT {q.company.nit}</p>}
        </div>
      </header>

      <section className="px-5 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[22px] font-bold">Cotización {quoteCode(q.number)}</h1>
          <QuoteChip status={q.status} />
        </div>
        <p className="mt-1 text-[13px] text-muted">
          Para {q.customer.contact_name ?? q.customer.name} · {day(q.created_at)}
        </p>
        {q.valid_until && <p className="text-[13px] text-muted">Válida hasta el {day(q.valid_until).toLowerCase()}</p>}
        {q.notes && <p className="mt-4 rounded-[10px] bg-bg p-3 text-sm whitespace-pre-line">{q.notes}</p>}

        <ul className="mt-5 divide-y divide-line-soft border-y border-line-soft">
          {items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="block">{i.description}</span>
                <span className="font-display tabular text-xs text-muted">
                  {i.quantity.toLocaleString("es-CO")} × {cop(i.unit_price)}
                </span>
              </span>
              <span className="font-display tabular shrink-0 font-semibold">{cop(itemTotal(i))}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-3">
          <span className="font-semibold">Total (IVA incluido)</span>
          <span className="font-display tabular text-[22px] font-bold">{cop(q.total)}</span>
        </p>

        <a href={`/c/${token}/pdf`} className="btn-dark mt-6 h-[54px] w-full">
          <Download size={18} aria-hidden /> Descargar PDF
        </a>
        {q.company.phone && (
          <p className="mt-3 text-center text-sm text-muted">¿Preguntas? Escríbenos al {formatPhone(q.company.phone)}.</p>
        )}
        <p className="mt-8 text-center text-[11px] text-muted">Enviado con tecnio</p>
      </section>
    </main>
  );
}

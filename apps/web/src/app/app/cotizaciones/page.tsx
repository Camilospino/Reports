import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { QuoteChip } from "@/components/ui/quote-chip";
import { requireStaff } from "@/lib/session";
import { cop, orderCode, quoteCode, shortDate } from "@/lib/format";
import { QUOTE_STATUS, type QuoteStatus } from "@/lib/quotes";

export const metadata = { title: "Cotizaciones · Tecnio" };

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { supabase, company } = await requireStaff();
  const { estado: raw } = await searchParams;
  const estado = raw && raw in QUOTE_STATUS ? (raw as QuoteStatus) : undefined;

  let query = supabase
    .from("quotes")
    .select("id, number, status, total, valid_until, created_at, sent_at, customers(name), work_orders(number)")
    .eq("company_id", company.id)
    .order("number", { ascending: false })
    .limit(200);
  if (estado) query = query.eq("status", estado);
  const { data: quotes, error } = await query;
  if (error) throw new Error(error.message);

  const tab = (active: boolean) =>
    `inline-flex h-9 items-center rounded-[8px] px-3.5 text-sm font-semibold ${active ? "bg-ink text-white" : "text-ink hover:bg-bg"}`;

  return (
    <>
      <PageHeader
        title="Cotizaciones"
        description="Crea cotizaciones, descárgalas en PDF y envíalas por WhatsApp."
        actions={
          <Link href="/app/cotizaciones/nueva" className="btn-accent">
            <Plus size={18} aria-hidden /> Nueva cotización
          </Link>
        }
      />

      <nav aria-label="Filtrar por estado" className="mb-5 inline-flex flex-wrap rounded-[10px] border border-line bg-surface p-[3px]">
        <Link href="/app/cotizaciones" className={tab(!estado)} aria-current={!estado ? "page" : undefined}>
          Todas
        </Link>
        {(Object.keys(QUOTE_STATUS) as QuoteStatus[]).map((s) => (
          <Link key={s} href={`/app/cotizaciones?estado=${s}`} className={tab(estado === s)} aria-current={estado === s ? "page" : undefined}>
            {QUOTE_STATUS[s].label}
          </Link>
        ))}
      </nav>

      <section className="card px-2 pt-3 pb-2">
        {!quotes.length ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm text-muted">{estado ? "No hay cotizaciones en ese estado." : "Aún no tienes cotizaciones."}</p>
            {!estado && (
              <Link href="/app/cotizaciones/nueva" className="btn-accent mt-4">
                <Plus size={18} aria-hidden /> Nueva cotización
              </Link>
            )}
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">Cotizaciones</caption>
              <thead>
                <tr>
                  <th className="th">Cotización</th>
                  <th className="th">Cliente</th>
                  <th className="th">Creada</th>
                  <th className="th">Válida hasta</th>
                  <th className="th text-right">Total</th>
                  <th className="th">Estado</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id}>
                    <td className="td whitespace-nowrap">
                      <Link href={`/app/cotizaciones/${q.id}`} className="link">
                        {quoteCode(q.number)}
                      </Link>
                    </td>
                    <td className="td font-medium">{q.customers?.name}</td>
                    <td className="td font-display tabular whitespace-nowrap">{shortDate(q.created_at)}</td>
                    <td className="td font-display tabular whitespace-nowrap">
                      {q.valid_until ? shortDate(`${q.valid_until}T12:00:00-05:00`) : <span className="text-muted">—</span>}
                    </td>
                    <td className="td font-display tabular text-right whitespace-nowrap">{cop(q.total)}</td>
                    <td className="td">
                      <span className="flex flex-wrap items-center gap-2">
                        <QuoteChip status={q.status} />
                        {q.work_orders && <span className="text-xs text-muted">→ {orderCode(q.work_orders.number)}</span>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

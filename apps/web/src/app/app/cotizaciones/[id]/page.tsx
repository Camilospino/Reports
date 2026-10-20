import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { QuoteChip } from "@/components/ui/quote-chip";
import { requireStaff } from "@/lib/session";
import { longDate, quoteCode } from "@/lib/format";
import { parseItems } from "@/lib/quotes";
import { quoteText, siteUrl } from "@/lib/messages";
import { QuoteEditor } from "../quote-editor";
import { in15Days, loadEditorData } from "../load";

export const metadata = { title: "Cotización · Tecnio" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, company } = await requireStaff();

  const [{ data: q }, { customers, materials }] = await Promise.all([
    supabase
      .from("quotes")
      .select("*, customers(name, contact_name), work_orders(id, number)")
      .eq("id", id)
      .eq("company_id", company.id)
      .maybeSingle(),
    loadEditorData(supabase, company.id),
  ]);
  if (!q) notFound();

  const url = `${await siteUrl()}/c/${q.public_token}`;
  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/cotizaciones" className="hover:underline">
          Cotizaciones
        </Link>{" "}
        / {quoteCode(q.number)}
      </nav>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {quoteCode(q.number)} <QuoteChip status={q.status} />
          </span>
        }
        description={`${q.customers?.name} · Creada el ${longDate(q.created_at).toLowerCase()}${
          q.status !== "borrador" ? ` · Enlace para el cliente: ${url}` : ""
        }`}
      />
      <QuoteEditor
        key={q.status}
        quote={{
          id: q.id,
          status: q.status,
          customer_id: q.customer_id,
          items: parseItems(q.items),
          valid_until: q.valid_until,
          notes: q.notes,
          shareText: quoteText(q.customers?.contact_name ?? q.customers?.name ?? "", company.name, q.number, url),
          workOrder: q.work_orders,
        }}
        customers={customers}
        materials={materials}
        defaultValidUntil={in15Days()}
      />
    </>
  );
}

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaff } from "@/lib/session";
import { QuoteEditor } from "../quote-editor";
import { in15Days, loadEditorData } from "../load";

export const metadata = { title: "Nueva cotización · Tecnio" };

export default async function NewQuotePage() {
  const { supabase, company } = await requireStaff();
  const { customers, materials } = await loadEditorData(supabase, company.id);
  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/cotizaciones" className="hover:underline">
          Cotizaciones
        </Link>{" "}
        / Nueva
      </nav>
      <PageHeader title="Nueva cotización" />
      <QuoteEditor quote={null} customers={customers} materials={materials} defaultValidUntil={in15Days()} />
    </>
  );
}

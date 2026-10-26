import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaff } from "@/lib/session";
import { UUID_RE, installationCode } from "@/lib/format";
import { QuoteEditor } from "../quote-editor";
import { in15Days, loadEditorData } from "../load";

export const metadata = { title: "Nueva cotización · Tecnio" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ cliente?: string; instalacion?: string }> }) {
  const { supabase, company } = await requireStaff();
  const { cliente, instalacion } = await searchParams;
  const [{ customers, materials }, installation] = await Promise.all([
    loadEditorData(supabase, company.id),
    // Desde el aviso de garantía de una instalación: la nota dice para qué es.
    instalacion && UUID_RE.test(instalacion)
      ? supabase.from("installations").select("number, name, customer_id").eq("id", instalacion).eq("company_id", company.id).maybeSingle()
      : null,
  ]);
  const customerId = installation?.data?.customer_id ?? cliente;
  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/cotizaciones" className="hover:underline">
          Cotizaciones
        </Link>{" "}
        / Nueva
      </nav>
      <PageHeader title="Nueva cotización" />
      <QuoteEditor
        quote={null}
        customers={customers}
        materials={materials}
        defaultValidUntil={in15Days()}
        initialCustomerId={customers.some((c) => c.id === customerId) ? customerId : undefined}
        initialNotes={
          installation?.data
            ? `Plan de mantenimiento anual para ${installation.data.name} (${installationCode(installation.data.number)}).`
            : undefined
        }
      />
    </>
  );
}

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireOwner } from "@/lib/session";
import { PaymentForm } from "./payment-form";

export const metadata = { title: "Datos de pago · Tecnio" };

export default async function PaymentSettingsPage() {
  const { supabase, company } = await requireOwner();
  const { data } = await supabase
    .from("companies")
    .select("payment_nequi, payment_bank, payment_account_type, payment_account_number, payment_account_holder, payment_holder_id, payment_notes")
    .eq("id", company.id)
    .single();

  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/ajustes" className="hover:underline">Ajustes</Link> / Datos de pago
      </nav>
      <PageHeader title="Datos de pago" description="Aparecen cuando tu cliente toca «Pagar» en el reporte del servicio." />
      <section className="card max-w-2xl">
        <PaymentForm
          values={
            data ?? {
              payment_nequi: null,
              payment_bank: null,
              payment_account_type: null,
              payment_account_number: null,
              payment_account_holder: null,
              payment_holder_id: null,
              payment_notes: null,
            }
          }
        />
      </section>
    </>
  );
}

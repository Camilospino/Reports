import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaff } from "@/lib/session";
import { createCustomer } from "../actions";
import { CustomerFields, SiteFields } from "../fields";

export const metadata = { title: "Nuevo cliente · Tecnio" };

export default async function NewCustomerPage() {
  await requireStaff();
  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/clientes" className="hover:underline">Clientes</Link> / Nuevo
      </nav>
      <PageHeader title="Nuevo cliente" />
      <ActionForm action={createCustomer} submit="Crear cliente" className="grid max-w-3xl gap-6">
        <fieldset className="card min-w-0">
          <legend className="font-display float-left mb-4 w-full text-lg font-bold">Datos del cliente</legend>
          <CustomerFields />
        </fieldset>
        <fieldset className="card min-w-0">
          <legend className="font-display float-left mb-1 w-full text-lg font-bold">Primera sede</legend>
          <p className="mb-4 text-sm text-muted">Donde se hacen los servicios. Puedes agregar más sedes después.</p>
          <SiteFields prefix="sede" requireAddress={false} />
        </fieldset>
      </ActionForm>
    </>
  );
}

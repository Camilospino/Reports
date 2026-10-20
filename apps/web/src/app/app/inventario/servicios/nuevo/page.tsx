import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaff } from "@/lib/session";
import { createService } from "../../actions";
import { ServiceFields } from "../../fields";
import { companySkills } from "../skills";

export const metadata = { title: "Nuevo servicio · Tecnio" };

export default async function NewServicePage() {
  const { supabase, company } = await requireStaff();
  const skills = await companySkills(supabase, company.id);
  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/inventario?tab=servicios" className="hover:underline">Tipos de servicio</Link> / Nuevo
      </nav>
      <PageHeader title="Nuevo tipo de servicio" />
      <ActionForm action={createService} submit="Crear servicio" className="card grid max-w-3xl gap-4">
        <ServiceFields skills={skills} />
      </ActionForm>
    </>
  );
}

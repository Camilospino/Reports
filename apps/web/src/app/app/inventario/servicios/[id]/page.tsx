import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { requireStaff } from "@/lib/session";
import { UUID_RE, duration } from "@/lib/format";
import { setServiceActive, updateService } from "../../actions";
import { ServiceFields } from "../../fields";
import { companySkills } from "../skills";

export const metadata = { title: "Tipo de servicio · Tecnio" };

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { supabase, company } = await requireStaff();

  const [{ data: s }, skills, { count }] = await Promise.all([
    supabase
      .from("service_types")
      .select("id, name, estimated_minutes, checklist, skill, warranty_months, active")
      .eq("id", id)
      .eq("company_id", company.id)
      .maybeSingle(),
    companySkills(supabase, company.id),
    supabase.from("work_orders").select("id", { count: "exact", head: true }).eq("company_id", company.id).eq("service_type_id", id),
  ]);
  if (!s) notFound();
  const checklist = Array.isArray(s.checklist) ? s.checklist.map(String) : [];

  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/inventario?tab=servicios" className="hover:underline">Tipos de servicio</Link> / {s.name}
      </nav>
      <PageHeader
        title={s.name}
        description={[duration(s.estimated_minutes * 60_000), `${count ?? 0} ${count === 1 ? "orden" : "órdenes"}`, s.active ? null : "Archivado"]
          .filter(Boolean)
          .join(" · ")}
      />
      <div className="grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SectionCard title="Datos del servicio">
          <ActionForm action={updateService.bind(null, s.id)} submit="Guardar cambios" buttonClassName="btn-dark">
            <ServiceFields values={{ ...s, checklist }} skills={skills} />
          </ActionForm>
        </SectionCard>
        <SectionCard title={s.active ? "Archivar servicio" : "Servicio archivado"} className="self-start">
          <p className="mb-3 text-sm text-muted">
            {s.active
              ? "Deja de aparecer al crear órdenes. Las órdenes que ya lo usan no cambian."
              : "No aparece al crear órdenes. Puedes devolverlo al catálogo cuando quieras."}
          </p>
          <ActionForm
            action={setServiceActive.bind(null, s.id, !s.active)}
            submit={s.active ? "Archivar" : "Volver al catálogo"}
            className="grid gap-3"
            buttonClassName="btn-outline"
          />
        </SectionCard>
      </div>
    </>
  );
}

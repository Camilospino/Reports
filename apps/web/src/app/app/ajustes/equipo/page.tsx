import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { requireStaff } from "@/lib/session";
import { planOf, upgradeHref } from "@/lib/plan";
import { ROLE_LABELS, formatPhone } from "@/lib/format";
import { siteUrl } from "@/lib/messages";
import { toggleMember } from "./actions";
import type { AccessLinks } from "./credentials";
import { MemberForm } from "./member-form";
import { ResetPassword } from "./reset-password";

export const metadata = { title: "Equipo · Tecnio" };

export default async function TeamPage() {
  const { supabase, company, membership } = await requireStaff();
  const isOwner = membership.role === "owner";
  const { data: members } = await supabase
    .from("memberships")
    .select("id, full_name, phone, role, skills, active")
    .eq("company_id", company.id)
    .order("role")
    .order("full_name");
  const plan = planOf(company.plan);
  const activeTechs = (members ?? []).filter((m) => m.role === "technician" && m.active).length;
  const full = activeTechs >= plan.technicians;
  const links: AccessLinks = {
    company: company.name,
    loginUrl: `${await siteUrl()}/login`,
    // Enlace para descargar la app del técnico (Play Store, APK o Expo). Sin él, el mensaje solo dice "la app".
    appUrl: process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || null,
  };

  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/ajustes" className="hover:underline">Ajustes</Link> / Equipo
      </nav>
      <PageHeader title="Equipo" description="Las personas de tu empresa que usan Tecnio." />

      <div className="flex flex-col gap-6">
        <div className={`rounded-[14px] border px-5 py-4 text-sm ${full ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}>
          <p className="font-semibold text-ink">
            Plan {plan.name}: {activeTechs} de {plan.technicians} técnicos activos
          </p>
          <p className="mt-0.5 text-muted">
            {full
              ? "Llegaste al límite de tu plan. Para sumar otro técnico, desactiva uno o cambia de plan. Los despachadores no cuentan."
              : "Los despachadores no cuentan en el límite."}
            {full && (
              <>
                {" "}
                <a href={upgradeHref(company.name, company.plan)} target="_blank" rel="noopener noreferrer" className="link">
                  Escríbenos para cambiar de plan
                </a>
              </>
            )}
          </p>
        </div>

        {isOwner && (
          <SectionCard title="Agregar a alguien">
            <MemberForm links={links} />
          </SectionCard>
        )}

        <SectionCard title={`Miembros · ${members?.length ?? 0}`} bodyClassName="px-2 pt-3 pb-2">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th className="th">Nombre</th>
                  <th className="th">Rol</th>
                  <th className="th">Celular</th>
                  <th className="th">Especialidades</th>
                  <th className="th">Acceso</th>
                </tr>
              </thead>
              <tbody>
                {members?.map((m) => (
                  <tr key={m.id} className={m.active ? "" : "opacity-60"}>
                    <td className="td">
                      <span className="flex items-center gap-3">
                        <Avatar name={m.full_name} size={34} />
                        <span className="font-semibold">{m.full_name}</span>
                      </span>
                    </td>
                    <td className="td">{ROLE_LABELS[m.role]}</td>
                    <td className="td whitespace-nowrap">{formatPhone(m.phone)}</td>
                    <td className="td text-muted">{m.skills.join(", ") || "—"}</td>
                    <td className="td">
                      {isOwner && m.id !== membership.id ? (
                        <div className="flex flex-wrap items-start gap-2">
                          <form action={toggleMember}>
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="active" value={String(!m.active)} />
                            <button
                              className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!m.active && m.role === "technician" && full}
                              title={!m.active && m.role === "technician" && full ? "Llegaste al límite de técnicos de tu plan" : undefined}
                              aria-label={`${m.active ? "Desactivar" : "Activar"} a ${m.full_name}`}
                            >
                              {m.active ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                          {m.active && m.role !== "owner" && <ResetPassword id={m.id} name={m.full_name} links={links} />}
                        </div>
                      ) : (
                        <span className="text-muted">{m.active ? "Activo" : "Inactivo"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </>
  );
}

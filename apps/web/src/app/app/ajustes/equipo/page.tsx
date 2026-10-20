import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { requireStaff } from "@/lib/session";
import { ROLE_LABELS, formatPhone } from "@/lib/format";
import { toggleMember } from "./actions";
import { InviteForm } from "./invite-form";

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

  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/ajustes" className="hover:underline">Ajustes</Link> / Equipo
      </nav>
      <PageHeader title="Equipo" description="Las personas de tu empresa que usan Tecnio." />

      <div className="flex flex-col gap-6">
        {isOwner && (
          <SectionCard title="Invitar a alguien">
            <InviteForm />
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
                        <form action={toggleMember}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="active" value={String(!m.active)} />
                          <button className="btn-outline" aria-label={`${m.active ? "Desactivar" : "Activar"} a ${m.full_name}`}>
                            {m.active ? "Desactivar" : "Activar"}
                          </button>
                        </form>
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

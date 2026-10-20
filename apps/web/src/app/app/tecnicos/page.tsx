import Link from "next/link";
import { Star, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { RealtimeRefresh } from "@/components/panel/realtime-refresh";
import { requireStaff } from "@/lib/session";
import { copMillions, formatPhone } from "@/lib/format";
import { loadTechnicianActivity, ratingText, summarize } from "@/lib/technicians";

export const metadata = { title: "Técnicos · Tecnio" };

const TONE = {
  busy: "bg-accent-soft text-[#A33A0B]",
  free: "bg-primary-soft text-primary",
  off: "bg-line-soft text-muted",
} as const;

export default async function TechniciansPage() {
  const { supabase, company, membership } = await requireStaff();
  const [{ data: technicians, error }, activity] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, full_name, phone, skills, active")
      .eq("company_id", company.id)
      .eq("role", "technician")
      .order("active", { ascending: false })
      .order("full_name"),
    loadTechnicianActivity(supabase, company.id),
  ]);
  if (error) throw new Error(error.message);
  const active = technicians?.filter((t) => t.active).length ?? 0;

  return (
    <>
      <RealtimeRefresh tables={["work_orders"]} companyId={company.id} />
      <PageHeader
        title="Técnicos"
        description={`${active} ${active === 1 ? "técnico activo" : "técnicos activos"}. Su carga de hoy y su desempeño del mes.`}
        actions={
          membership.role === "owner" && (
            <Link href="/app/ajustes/equipo" className="btn-accent">
              <UserPlus size={18} aria-hidden /> Invitar técnico
            </Link>
          )
        }
      />

      {!technicians?.length ? (
        <section className="card py-10 text-center">
          <p className="text-sm text-muted">
            Aún no tienes técnicos.{" "}
            {membership.role === "owner" ? "Invítalos para que reciban sus órdenes en la app." : "El dueño de la empresa puede invitarlos."}
          </p>
          {membership.role === "owner" && (
            <Link href="/app/ajustes/equipo" className="btn-accent mt-4">
              <UserPlus size={18} aria-hidden /> Invitar técnico
            </Link>
          )}
        </section>
      ) : (
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))]">
          {technicians.map((t) => {
            const s = summarize(activity, t.id);
            return (
              <li key={t.id} className="card relative flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={t.full_name} size={44} />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg leading-tight font-bold">
                      {/* Toda la tarjeta es clicable; el enlace es el nombre (after:inset-0). */}
                      <Link href={`/app/tecnicos/${t.id}`} className="after:absolute after:inset-0 after:rounded-[14px] hover:underline">
                        {t.full_name}
                      </Link>
                    </h2>
                    <p className="text-sm text-muted">{formatPhone(t.phone)}</p>
                  </div>
                  {!t.active && <span className="rounded-full bg-line-soft px-2 py-0.5 text-xs font-semibold text-muted">Inactivo</span>}
                </div>

                {t.skills.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" aria-label="Especialidades">
                    {t.skills.map((k) => (
                      <li key={k} className="rounded-full border border-line px-2 py-0.5 text-xs font-medium">{k}</li>
                    ))}
                  </ul>
                )}

                {t.active && <p className={`rounded-[10px] px-3 py-2 text-sm font-medium ${TONE[s.now.tone]}`}>{s.now.label}</p>}

                <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line-soft pt-3 text-center">
                  <div>
                    <dt className="text-xs text-muted">Hoy</dt>
                    <dd className="font-display tabular text-lg font-bold">
                      {s.todayDone}/{s.today.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Mes</dt>
                    <dd className="font-display tabular text-lg font-bold">
                      {s.monthDone}
                      <span className="sr-only"> completadas, </span>
                      <span className="block text-xs font-normal text-muted">{copMillions(s.monthBilled)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Calificación</dt>
                    <dd className="font-display tabular text-lg font-bold">
                      <span className="inline-flex items-center gap-1">
                        {s.rating !== null && <Star size={14} className="fill-accent text-accent" aria-hidden />}
                        {ratingText(s.rating)}
                      </span>
                      <span className="block text-xs font-normal text-muted">
                        {s.ratingCount} {s.ratingCount === 1 ? "voto" : "votos"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

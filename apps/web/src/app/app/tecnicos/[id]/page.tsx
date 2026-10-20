import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MessageCircle, Star } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusChip } from "@/components/ui/status-chip";
import { RealtimeRefresh } from "@/components/panel/realtime-refresh";
import { requireStaff } from "@/lib/session";
import { UUID_RE, cop, copMillions, formatPhone, orderCode, shortDate, time, whatsappLink } from "@/lib/format";
import { loadTechnicianActivity, ratingText, summarize } from "@/lib/technicians";
import { updateTechnician } from "../actions";

export const metadata = { title: "Técnico · Tecnio" };

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} aria-hidden className={i < n ? "fill-accent text-accent" : "text-line"} />
      ))}
    </span>
  );
}

// La calificación es 1 a 1 con la orden; según la versión de PostgREST llega como objeto o lista.
const starsOf = (r: { stars: number } | { stars: number }[] | null) => (Array.isArray(r) ? r[0]?.stars : r?.stars) ?? null;

export default async function TechnicianPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { supabase, company, membership } = await requireStaff();
  const isOwner = membership.role === "owner";

  const { data: tech } = await supabase
    .from("memberships")
    .select("id, full_name, phone, skills, active, created_at")
    .eq("id", id)
    .eq("company_id", company.id)
    .eq("role", "technician")
    .maybeSingle();
  if (!tech) notFound();

  const [activity, history, comments, absences] = await Promise.all([
    loadTechnicianActivity(supabase, company.id, id),
    supabase
      .from("work_orders")
      .select("id, number, title, total, completed_at, customers(name), work_order_ratings(stars)")
      .eq("company_id", company.id)
      .eq("technician_id", id)
      .eq("status", "completada")
      .order("completed_at", { ascending: false })
      .limit(30),
    supabase
      .from("work_order_ratings")
      .select("stars, comment, created_at, work_orders!inner(id, number, technician_id, customers(name))")
      .eq("company_id", company.id)
      .eq("work_orders.technician_id", id)
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("absences")
      .select("id, reason, starts_at, ends_at")
      .eq("company_id", company.id)
      .eq("technician_id", id)
      .gt("ends_at", new Date().toISOString())
      .order("starts_at")
      .limit(5),
  ]);
  const s = summarize(activity, id);

  return (
    <>
      <RealtimeRefresh tables={["work_orders"]} companyId={company.id} />
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/tecnicos" className="hover:underline">Técnicos</Link> / {tech.full_name}
      </nav>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Avatar name={tech.full_name} size={48} />
            {tech.full_name}
          </span>
        }
        description={[tech.skills.join(", "), formatPhone(tech.phone), tech.active ? null : "Inactivo"].filter((x) => x && x !== "—").join(" · ")}
        actions={
          <>
            {tech.phone && (
              <a href={whatsappLink(tech.phone, `Hola ${tech.full_name.split(" ")[0]}`)} target="_blank" rel="noreferrer" className="btn-outline">
                <MessageCircle size={18} aria-hidden /> WhatsApp
              </a>
            )}
            <Link href="/app/agenda" className="btn-outline">
              <Calendar size={18} aria-hidden /> Ver agenda
            </Link>
          </>
        }
      />

      <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <StatCard
          label="Hoy"
          value={`${s.todayDone}/${s.today.length}`}
          detail={s.now.label}
          progress={s.today.length ? s.todayDone / s.today.length : undefined}
        />
        <StatCard label="Completadas este mes" value={s.monthDone} detail={`${copMillions(s.monthBilled)} facturados`} />
        <StatCard
          label="Calificación"
          value={ratingText(s.rating)}
          suffix={s.rating !== null ? "/ 5" : undefined}
          detail={`${s.ratingCount} ${s.ratingCount === 1 ? "calificación" : "calificaciones"} de clientes`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard title="Órdenes de hoy" bodyClassName="px-5 py-2">
            {!s.today.length ? (
              <p className="py-4 text-sm text-muted">No tiene órdenes programadas para hoy.</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {s.today.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                    <span className="font-display tabular w-12 font-semibold">{time(o.scheduled_start)}</span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/app/ordenes/${o.id}`} className="link">{orderCode(o.number)}</Link>{" "}
                      <span className="text-sm">{o.customers?.name}</span>
                      <span className="block text-xs text-muted">{o.title}</span>
                    </span>
                    <StatusChip status={o.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Últimos servicios" bodyClassName="px-2 pt-3 pb-2">
            {!history.data?.length ? (
              <p className="px-3 py-6 text-center text-sm text-muted">Aún no ha completado órdenes.</p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <caption className="sr-only">Últimas órdenes completadas por {tech.full_name}</caption>
                  <thead>
                    <tr>
                      <th className="th">Orden</th>
                      <th className="th">Cliente</th>
                      <th className="th">Fecha</th>
                      <th className="th text-right">Total</th>
                      <th className="th">Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.map((o) => (
                      <tr key={o.id}>
                        <td className="td whitespace-nowrap">
                          <Link href={`/app/ordenes/${o.id}`} className="link">{orderCode(o.number)}</Link>
                        </td>
                        <td className="td">
                          {o.customers?.name}
                          <span className="block text-xs text-muted">{o.title}</span>
                        </td>
                        <td className="td font-display tabular whitespace-nowrap">{o.completed_at ? shortDate(o.completed_at) : "—"}</td>
                        <td className="td font-display tabular text-right whitespace-nowrap">{cop(o.total)}</td>
                        <td className="td">{starsOf(o.work_order_ratings) ? <Stars n={starsOf(o.work_order_ratings)!} /> : <span className="text-muted">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard title="Lo que dicen los clientes" bodyClassName="px-5 py-2">
            {!comments.data?.length ? (
              <p className="py-4 text-sm text-muted">Aún no hay comentarios.</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {comments.data.map((c) => (
                  <li key={c.work_orders.id} className="py-3">
                    <Stars n={c.stars} />
                    <p className="mt-1 text-sm">“{c.comment}”</p>
                    <p className="mt-1 text-xs text-muted">
                      {c.work_orders.customers?.name} ·{" "}
                      <Link href={`/app/ordenes/${c.work_orders.id}`} className="hover:underline">{orderCode(c.work_orders.number)}</Link> ·{" "}
                      {shortDate(c.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Ausencias" bodyClassName="px-5 py-2">
            {!absences.data?.length ? (
              <p className="py-4 text-sm text-muted">Sin ausencias programadas. Se registran desde la agenda.</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {absences.data.map((a) => (
                  <li key={a.id} className="py-3 text-sm">
                    <p className="font-semibold">{a.reason}</p>
                    <p className="font-display tabular text-muted">
                      {shortDate(a.starts_at)} {time(a.starts_at)} – {shortDate(a.ends_at)} {time(a.ends_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Datos del técnico">
            {isOwner ? (
              <ActionForm action={updateTechnician.bind(null, tech.id)} submit="Guardar cambios" buttonClassName="btn-dark">
                <div>
                  <label className="label" htmlFor="full_name">Nombre</label>
                  <input id="full_name" name="full_name" required maxLength={120} defaultValue={tech.full_name} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="phone">Celular</label>
                  <input id="phone" name="phone" type="tel" placeholder="300 111 2233" defaultValue={tech.phone ? formatPhone(tech.phone) : ""} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="skills">Especialidades</label>
                  <input id="skills" name="skills" placeholder="CCTV, Alarmas" defaultValue={tech.skills.join(", ")} className="input" aria-describedby="skills-hint" />
                  <p id="skills-hint" className="mt-1 text-xs text-muted">Separadas por coma. La agenda las usa para sugerir técnico.</p>
                </div>
              </ActionForm>
            ) : (
              <p className="text-sm text-muted">Solo el dueño de la empresa puede editar los datos del técnico.</p>
            )}
            <p className="mt-4 text-sm text-muted">
              En Tecnio desde el {shortDate(tech.created_at)}.{" "}
              {isOwner && (
                <>
                  Para quitarle el acceso, ve a <Link href="/app/ajustes/equipo" className="link">Ajustes · Equipo</Link>.
                </>
              )}
            </p>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

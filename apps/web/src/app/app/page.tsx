import Link from "next/link";
import { Clock, FileText, Package, Plus, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusChip } from "@/components/ui/status-chip";
import { RealtimeRefresh } from "@/components/panel/realtime-refresh";
import { loadDashboard } from "@/lib/dashboard";
import { requireStaff } from "@/lib/session";
import { TZ, cop, copMillions, greeting, longDate, orderCode, qty, quoteCode, time, whatsappLink } from "@/lib/format";

export const metadata = { title: "Inicio · Tecnio" };

const monthName = (d: Date) => new Intl.DateTimeFormat("es-CO", { month: "long", timeZone: TZ }).format(d);

export default async function HomePage() {
  const { supabase, membership, company } = await requireStaff();
  const now = new Date();
  const { kpis, todayOrders, technicianStatus, alerts } = await loadDashboard(supabase, company.id, now);

  const firstName = membership.full_name.split(" ")[0];
  const prevMonth = new Date(now.getTime() - 31 * 86_400_000);
  const change =
    kpis.billed_prev_month_to_date > 0
      ? Math.round(((kpis.billed_month - kpis.billed_prev_month_to_date) / kpis.billed_prev_month_to_date) * 100)
      : null;
  const progress = kpis.orders_total ? kpis.orders_completed / kpis.orders_total : 0;
  const alertCount = alerts.late.length + alerts.lowStock.length + alerts.staleQuotes.length;

  return (
    <>
      <RealtimeRefresh companyId={company.id} />
      <PageHeader
        eyebrow={longDate(now)}
        title={`${greeting(now)}, ${firstName}`}
        actions={
          <>
            <form action="/app/ordenes" role="search" className="relative min-w-[240px] flex-1">
              <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
              <label htmlFor="buscar" className="sr-only">Buscar</label>
              <input id="buscar" name="q" type="search" placeholder="Buscar orden, cliente o técnico" className="input pl-10" />
            </form>
            <Link href="/app/ordenes/nueva" className="btn-accent">
              <Plus size={18} aria-hidden /> Nueva orden
            </Link>
          </>
        }
      />

      {/* Indicadores */}
      <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
        <StatCard
          label="Órdenes de hoy"
          value={kpis.orders_total}
          progress={progress}
          detail={`${kpis.orders_completed} completadas · ${kpis.orders_in_progress} en curso · ${kpis.orders_unassigned} sin asignar`}
        />
        <StatCard
          label="Técnicos en campo"
          value={kpis.technicians_in_field}
          suffix={`/ ${kpis.technicians_total}`}
          detail={
            kpis.technicians_total === 0
              ? "Aún no tienes técnicos"
              : kpis.technicians_offline > 0
                ? `${kpis.technicians_offline} sin conexión desde las ${time(kpis.offline_since)}`
                : "Todos reportando"
          }
        />
        <StatCard
          label="Cotizaciones por aprobar"
          value={kpis.quotes_pending}
          detail={
            <>
              <span className="font-semibold text-ink">{cop(kpis.quotes_pending_total)}</span> en espera de respuesta
            </>
          }
        />
        <StatCard
          label={`Facturado en ${monthName(now)}`}
          value={copMillions(kpis.billed_month)}
          detail={
            change === null ? (
              `Sin datos de ${monthName(prevMonth)} para comparar`
            ) : (
              <span className="font-semibold" style={{ color: change >= 0 ? "var(--primary)" : "#9B1C1C" }}>
                {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% vs. {monthName(prevMonth)} a la fecha
              </span>
            )
          }
        />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {/* Órdenes de hoy */}
        <SectionCard
          title="Órdenes de hoy"
          className="flex-[1_1_560px]"
          bodyClassName="px-2 pt-3 pb-2"
          action={
            <Link href="/app/agenda" className="link text-sm">
              Ver agenda →
            </Link>
          }
        >
          {todayOrders.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm text-muted">Aún no tienes órdenes hoy.</p>
              <Link href="/app/ordenes/nueva" className="btn-accent mt-4">
                <Plus size={18} aria-hidden /> Crea la primera
              </Link>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <caption className="sr-only">Órdenes programadas para hoy</caption>
                <thead>
                  <tr>
                    <th className="th">Orden</th>
                    <th className="th">Cliente</th>
                    <th className="th">Servicio</th>
                    <th className="th">Técnico</th>
                    <th className="th">Hora</th>
                    <th className="th">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {todayOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="td whitespace-nowrap">
                        <Link href={`/app/ordenes/${o.id}`} className="link">
                          {orderCode(o.number)}
                        </Link>
                      </td>
                      <td className="td">
                        <p className="font-medium">{o.customer}</p>
                        {o.neighborhood && <p className="text-xs text-muted">{o.neighborhood}</p>}
                      </td>
                      <td className="td">{o.service}</td>
                      <td className="td whitespace-nowrap">
                        {o.technician ?? <span className="text-muted">Sin asignar</span>}
                      </td>
                      <td className="td font-display tabular whitespace-nowrap">{time(o.start)}</td>
                      <td className="td">
                        <StatusChip status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6 xl:max-w-[320px]">
          {/* Técnicos ahora */}
          <SectionCard title="Técnicos ahora" bodyClassName="py-2">
            {technicianStatus.length === 0 ? (
              <p className="py-3 text-sm text-muted">
                Aún no tienes técnicos. <Link href="/app/ajustes/equipo" className="link">Invítalos en Ajustes</Link>.
              </p>
            ) : (
              <ul>
                {technicianStatus.map((t, i) => (
                  <li key={t.id} className={`flex items-center gap-3 py-3 ${i ? "border-t border-line-soft" : ""}`}>
                    <Avatar name={t.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.name}</p>
                      <p className="truncate text-[13px] text-muted">{t.detail}</p>
                    </div>
                    <StatusChip status={t.chip} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Requiere atención */}
          <SectionCard title="Requiere atención" bodyClassName="py-2">
            {alertCount === 0 ? (
              <p className="py-3 text-sm text-muted">Todo en orden por ahora.</p>
            ) : (
              <ul>
                {alerts.late.slice(0, 3).map((o) => (
                  <Alert key={o.id} icon={<Clock size={16} aria-hidden />} bg="var(--accent-soft)" fg="#A33A0B">
                    <Link href={`/app/ordenes/${o.id}`} className="font-semibold hover:underline">
                      {orderCode(o.number)} atrasada
                    </Link>{" "}
                    <span className="text-muted">
                      Debía empezar a las {time(o.start)} · {o.customer}
                      {o.unassigned && " · sin técnico"}
                    </span>
                  </Alert>
                ))}
                {alerts.late.length > 3 && (
                  <li className="border-t border-line-soft py-3 pl-11 text-sm">
                    <Link href="/app/ordenes?estado=asignada" className="link">
                      Ver las {alerts.late.length} órdenes atrasadas
                    </Link>
                  </li>
                )}
                {alerts.lowStock.map((m) => (
                  <Alert key={m.id} icon={<Package size={16} aria-hidden />} bg="#E4ECFA" fg="#1F4FA8">
                    <Link href={`/app/inventario/${m.id}`} className="font-semibold hover:underline">{m.name}: quedan pocos</Link>{" "}
                    <span className="text-muted">
                      Hay {qty(m.stock)} {m.unit} · mínimo {qty(m.min)}
                    </span>
                  </Alert>
                ))}
                {alerts.staleQuotes.map((q) => {
                  const days = Math.floor((now.getTime() - new Date(q.sentAt).getTime()) / 86_400_000);
                  return (
                    <Alert key={q.id} icon={<FileText size={16} aria-hidden />} bg="var(--primary-soft)" fg="var(--primary)">
                      <span className="font-semibold">{quoteCode(q.number)} sin respuesta</span>{" "}
                      <span className="text-muted">
                        {q.customer} · enviada hace {days} días · {cop(q.total)}
                      </span>
                      {q.phone && (
                        <a
                          className="link mt-1 block"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={whatsappLink(
                            q.phone,
                            `Hola ${q.contact}, te escribimos de ${company.name}. ¿Pudiste revisar la cotización ${quoteCode(q.number)} por ${cop(q.total)}? Quedamos atentos.`,
                          )}
                        >
                          Enviar recordatorio
                        </a>
                      )}
                    </Alert>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function Alert({ icon, bg, fg, children }: { icon: React.ReactNode; bg: string; fg: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 border-t border-line-soft py-3 text-sm first:border-t-0">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px]" style={{ background: bg, color: fg }}>
        {icon}
      </span>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

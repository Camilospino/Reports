import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Plus } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { ToneChip } from "@/components/ui/tone-chip";
import { requireStaff } from "@/lib/session";
import { siteUrl } from "@/lib/messages";
import {
  UUID_RE,
  bogotaDateKey,
  dayLabel,
  dayLabelWithYear,
  formatPhone,
  installationCode,
  orderCode,
  shortDate,
  type WorkOrderStatus,
} from "@/lib/format";
import {
  SYSTEM_LABELS,
  TONES,
  daysText,
  daysUntil,
  installationBadge,
  maintenanceFrequency,
  warrantyProgress,
  warrantyState,
} from "@/lib/installations";
import { loadInstallation } from "../load";
import { EquipmentTable } from "./equipment-table";
import { CredentialsList } from "./credentials-card";
import { FilesCard } from "./files-card";
import { QrButton } from "./qr-modal";

export const metadata = { title: "Instalación · Tecnio" };

// Abierta (azul), completada (verde), cancelada (gris).
function orderDot(status: WorkOrderStatus) {
  if (status === "completada") return TONES.green.fg;
  if (status === "cancelada") return TONES.gray.fg;
  return TONES.blue.fg;
}

// "12 oct" este año, "12 oct 2025" otros años.
function orderDate(iso: string, today: string) {
  const year = new Intl.DateTimeFormat("en-CA", { year: "numeric", timeZone: "America/Bogota" }).format(new Date(iso));
  return year === today.slice(0, 4) ? shortDate(iso) : `${shortDate(iso)} ${year}`;
}

const short = (text: string | null, max = 70) => (text && text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

export default async function InstallationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { supabase, company, membership } = await requireStaff();

  const data = await loadInstallation(supabase, company.id, id, membership.role);
  if (!data) notFound();
  const { installation: ins, assets, orders, credentials, canSeeCredentials, files } = data;

  const today = bogotaDateKey();
  const badge = installationBadge(ins, assets, today);
  const warranty = warrantyState(ins.warranty_until, today);
  const progress = ins.warranty_until ? warrantyProgress(ins.installed_on, ins.warranty_until, today) : null;
  const customer = ins.customers;
  const site = ins.sites;
  const address = [site.address, site.neighborhood].filter(Boolean).join(", ");
  const activeAssets = assets.filter((a) => a.status !== "retirado").length;

  const query = (extra: Record<string, string> = {}) =>
    new URLSearchParams({ instalacion: ins.id, cliente: ins.customer_id, ...extra }).toString();
  const newOrderHref = `/app/ordenes/nueva?${query()}`;
  const maintenanceHref = `/app/ordenes/nueva?${query({ mantenimiento: "1", ...(ins.next_maintenance ? { fecha: ins.next_maintenance } : {}) })}`;
  const quoteHref = `/app/cotizaciones/nueva?${query()}`;

  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/instalaciones" className="hover:underline">
          Instalaciones
        </Link>{" "}
        / {installationCode(ins.number)}
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[30px] leading-tight font-bold tracking-[-0.02em]">{ins.name}</h1>
            <ToneChip tone={badge.tone} size="lg">
              {badge.label}
            </ToneChip>
          </div>
          <p className="mt-1 text-sm text-muted [overflow-wrap:anywhere]">
            {customer.name}
            {address && ` · ${address}`} · {activeAssets} {activeAssets === 1 ? "equipo" : "equipos"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <QrButton
            installationId={ins.id}
            baseUrl={await siteUrl()}
            labels={assets.filter((a) => a.status !== "retirado").map((a) => ({ id: a.id, name: a.name ?? a.type }))}
          />
          <Link href={newOrderHref} className="btn-accent">
            <Plus size={18} aria-hidden />
            Nueva orden aquí
          </Link>
        </div>
      </div>

      {(warranty.kind === "soon" || warranty.kind === "expired") && (
        <div
          role="status"
          className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-[14px] px-5 py-4 text-sm"
          style={
            warranty.kind === "soon"
              ? { background: TONES.amber.bg, color: "#5C3800" }
              : { background: TONES.red.bg, color: "#7A1A1A" }
          }
        >
          <p>
            {warranty.kind === "soon" ? (
              <>
                <strong>
                  La garantía vence {warranty.days === 0 ? "hoy" : `en ${daysText(warranty.days)}`} ({dayLabel(ins.warranty_until!)}).
                </strong>{" "}
                Es buen momento para ofrecerle al cliente un plan de mantenimiento anual.
              </>
            ) : (
              <strong>La garantía venció el {dayLabel(ins.warranty_until!)}.</strong>
            )}
          </p>
          <Link href={quoteHref} className="font-semibold whitespace-nowrap underline underline-offset-2 hover:no-underline">
            Crear cotización
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-6">
        {/* Columna izquierda */}
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-6">
          <SectionCard title="Equipos instalados">
            <EquipmentTable installationId={ins.id} companyId={company.id} assets={assets} />
          </SectionCard>

          <SectionCard title="Historial de órdenes">
            {orders.length ? (
              <ul className="divide-y divide-line-soft">
                {orders.map((o) => {
                  const when = o.completed_at ?? o.scheduled_start ?? o.created_at;
                  const detail = o.id === ins.origin_work_order_id ? "origen de esta instalación" : short(o.description);
                  return (
                    <li key={o.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                      <span aria-hidden className="mt-[7px] size-2 shrink-0 rounded-full" style={{ background: orderDot(o.status) }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <Link href={`/app/ordenes/${o.id}`} className="link">
                            {orderCode(o.number)}
                          </Link>{" "}
                          · <span className="font-semibold">{o.service_types?.name ?? o.title}</span>
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted [overflow-wrap:anywhere]">
                          {[o.memberships?.full_name ?? "Sin técnico", orderDate(when, today), detail].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <StatusChip status={o.status} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">Esta instalación todavía no tiene órdenes.</p>
            )}
          </SectionCard>
        </div>

        {/* Columna derecha */}
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6 xl:max-w-[340px]">
          <SectionCard title="Garantía y mantenimiento">
            {ins.warranty_until && progress ? (
              <div>
                <div className="flex justify-between gap-3 text-[13px] text-muted">
                  <span>Inicio · {dayLabelWithYear(ins.installed_on)}</span>
                  <span>Fin · {dayLabelWithYear(ins.warranty_until)}</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress.percent}
                  aria-label={`Garantía: ${progress.percent} % del tiempo transcurrido, ${
                    warranty.kind === "expired"
                      ? `venció el ${dayLabel(ins.warranty_until)}`
                      : warranty.kind === "none"
                        ? ""
                        : `vence en ${daysText(warranty.days)}`
                  }`}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-line-soft"
                >
                  <div className="h-full rounded-full" style={{ width: `${progress.percent}%`, background: TONES[progress.tone].fg }} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Sin garantía registrada.</p>
            )}

            <dl className="mt-5 divide-y divide-line-soft text-sm">
              <Row label="Frecuencia">{maintenanceFrequency(ins.maintenance_every_months)}</Row>
              <Row label="Último mantenimiento">{ins.last_maintenance ? dayLabelWithYear(ins.last_maintenance) : "—"}</Row>
              <Row label="Próximo">
                {ins.next_maintenance ? (
                  <>
                    {dayLabelWithYear(ins.next_maintenance)}
                    <span className="block text-[13px] text-muted">
                      {(() => {
                        const d = daysUntil(ins.next_maintenance, today);
                        return d === 0 ? "hoy" : d > 0 ? `en ${daysText(d)}` : `hace ${daysText(-d)}`;
                      })()}
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </Row>
            </dl>
            <Link href={maintenanceHref} className="btn-outline mt-5 w-full">
              <CalendarPlus size={18} aria-hidden />
              Programar mantenimiento
            </Link>
          </SectionCard>

          <SectionCard title="Datos de la instalación">
            <dl className="divide-y divide-line-soft text-sm">
              <Row label="Cliente">
                <Link href={`/app/clientes/${customer.id}`} className="link">
                  {customer.name}
                </Link>
              </Row>
              <Row label="Contacto">
                {customer.contact_name ?? "—"}
                {customer.phone_whatsapp && <span className="block text-[13px] text-muted">{formatPhone(customer.phone_whatsapp)}</span>}
              </Row>
              <Row label="Orden de origen">
                {ins.origin ? (
                  <Link href={`/app/ordenes/${ins.origin.id}`} className="link">
                    {orderCode(ins.origin.number)}
                  </Link>
                ) : (
                  "—"
                )}
              </Row>
              <Row label="Instalada por">{ins.installer?.full_name ?? "—"}</Row>
              <Row label="Fecha de instalación">{dayLabelWithYear(ins.installed_on)}</Row>
              <Row label="Sistema">{SYSTEM_LABELS[ins.system_type]}</Row>
            </dl>
            {ins.notes && <p className="mt-4 rounded-[10px] bg-bg p-3 text-[13px] whitespace-pre-line text-muted">{ins.notes}</p>}
          </SectionCard>

          {canSeeCredentials && (
            <SectionCard title="Accesos técnicos" action={<ToneChip tone="gray">Solo dueño y técnicos</ToneChip>}>
              <CredentialsList credentials={credentials} />
            </SectionCard>
          )}

          <FilesCard installationId={ins.id} companyId={company.id} files={files} />
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

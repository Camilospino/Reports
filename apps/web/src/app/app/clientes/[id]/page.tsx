import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Navigation, Plus, Trash2 } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { QuoteChip } from "@/components/ui/quote-chip";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusChip } from "@/components/ui/status-chip";
import { requireStaff } from "@/lib/session";
import { UUID_RE, cop, directionsLink, formatPhone, orderCode, quoteCode, shortDate, whatsappLink } from "@/lib/format";
import { addAsset, addSite, deleteAsset, deleteCustomer, deleteSite, updateCustomer, updateSite } from "../actions";
import { CustomerFields, SiteFields } from "../fields";

export const metadata = { title: "Cliente · Tecnio" };

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { supabase, company } = await requireStaff();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, contact_name, phone_whatsapp, email, tax_id, notes, created_at")
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!customer) notFound();

  const [sites, orders, quotes, stats] = await Promise.all([
    supabase
      .from("sites")
      .select("id, address, neighborhood, city, lat, lng, access_notes, assets(id, type, brand, model, serial)")
      .eq("company_id", company.id)
      .eq("customer_id", id)
      .order("created_at"),
    supabase
      .from("work_orders")
      .select("id, number, title, status, total, scheduled_start, completed_at, memberships(full_name)")
      .eq("company_id", company.id)
      .eq("customer_id", id)
      .order("scheduled_start", { ascending: false, nullsFirst: true })
      .limit(50),
    supabase
      .from("quotes")
      .select("id, number, status, total, created_at")
      .eq("company_id", company.id)
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("customer_stats").select("orders, open_orders, last_service, billed").eq("customer_id", id).maybeSingle(),
  ]);
  const s = stats.data;
  const isNew = (await searchParams).nuevo === "1";
  const greeting = `Hola${customer.contact_name ? ` ${customer.contact_name.split(" ")[0]}` : ""}, te escribimos de ${company.name}.`;

  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/clientes" className="hover:underline">Clientes</Link> / {customer.name}
      </nav>
      <PageHeader
        title={customer.name}
        description={[customer.contact_name, formatPhone(customer.phone_whatsapp), customer.tax_id && `NIT ${customer.tax_id}`]
          .filter((x) => x && x !== "—")
          .join(" · ")}
        actions={
          <>
            {customer.phone_whatsapp && (
              <a href={whatsappLink(customer.phone_whatsapp, greeting)} target="_blank" rel="noreferrer" className="btn-outline">
                <MessageCircle size={18} aria-hidden /> WhatsApp
              </a>
            )}
            <Link href={`/app/ordenes/nueva?cliente=${customer.id}`} className="btn-accent">
              <Plus size={18} aria-hidden /> Nueva orden
            </Link>
          </>
        }
      />

      {isNew && (
        <p role="status" className="mb-5 rounded-[10px] bg-primary-soft px-3 py-2.5 text-sm text-primary">
          Cliente creado. Agrega sus equipos o crea su primera orden.
        </p>
      )}

      <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <StatCard label="Órdenes" value={s?.orders ?? 0} detail={s?.open_orders ? `${s.open_orders} abiertas` : "Ninguna abierta"} />
        <StatCard label="Facturado" value={cop(s?.billed)} detail="Órdenes completadas" />
        <StatCard label="Último servicio" value={s?.last_service ? shortDate(s.last_service) : "—"} detail={`Cliente desde ${shortDate(customer.created_at)}`} />
        <StatCard label="Sedes" value={sites.data?.length ?? 0} detail={`${sites.data?.reduce((n, x) => n + x.assets.length, 0) ?? 0} equipos registrados`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard title="Sedes y equipos" bodyClassName="flex flex-col gap-4">
            {!sites.data?.length && <p className="text-sm text-muted">Este cliente aún no tiene direcciones.</p>}
            {sites.data?.map((site, n) => (
              <article key={site.id} className="rounded-[12px] border border-line p-4" aria-labelledby={`sede-${site.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 id={`sede-${site.id}`} className="flex items-start gap-2 font-semibold">
                      <MapPin size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                      <span className="[overflow-wrap:anywhere]">{site.address}</span>
                    </h3>
                    <p className="ml-6 text-sm text-muted">
                      {[site.neighborhood, site.city].filter(Boolean).join(", ") || "Sin barrio"}
                      {site.access_notes && ` · ${site.access_notes}`}
                    </p>
                  </div>
                  {site.lat != null && site.lng != null && (
                    <a href={directionsLink(site.lat, site.lng)} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1 text-sm">
                      <Navigation size={14} aria-hidden /> Cómo llegar
                    </a>
                  )}
                </div>

                <div className="mt-3 ml-6">
                  <p className="text-xs font-semibold tracking-[0.04em] text-muted uppercase">Equipos</p>
                  {site.assets.length ? (
                    <ul className="mt-1 divide-y divide-line-soft">
                      {site.assets.map((a) => {
                        const label = [a.type, a.brand, a.model].filter(Boolean).join(" · ");
                        return (
                          <li key={a.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                            <span className="min-w-0">
                              {label}
                              {a.serial && <span className="text-muted"> · Serie {a.serial}</span>}
                            </span>
                            <ActionForm
                              action={deleteAsset.bind(null, customer.id, a.id)}
                              confirm={`¿Eliminar el equipo ${label}?`}
                              className="flex items-center gap-2"
                              buttonClassName="inline-flex size-9 items-center justify-center rounded-[8px] text-muted hover:bg-bg hover:text-ink"
                              pendingLabel="…"
                              submit={
                                <>
                                  <Trash2 size={16} aria-hidden />
                                  <span className="sr-only">Eliminar {label}</span>
                                </>
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted">Sin equipos registrados.</p>
                  )}
                </div>

                <div className="mt-3 ml-6 flex flex-col gap-2">
                  <details className="group">
                    <summary className="link cursor-pointer text-sm">Agregar equipo</summary>
                    <ActionForm
                      action={addAsset.bind(null, customer.id, site.id)}
                      submit="Agregar equipo"
                      resetOnSuccess
                      className="mt-3 grid gap-3 sm:grid-cols-2"
                      buttonClassName="btn-dark"
                    >
                      <div>
                        <label className="label" htmlFor={`type-${n}`}>Equipo</label>
                        <input id={`type-${n}`} name="type" required maxLength={60} placeholder="Aire acondicionado, DVR…" className="input" />
                      </div>
                      <div>
                        <label className="label" htmlFor={`brand-${n}`}>Marca</label>
                        <input id={`brand-${n}`} name="brand" maxLength={60} className="input" />
                      </div>
                      <div>
                        <label className="label" htmlFor={`model-${n}`}>Modelo</label>
                        <input id={`model-${n}`} name="model" maxLength={60} className="input" />
                      </div>
                      <div>
                        <label className="label" htmlFor={`serial-${n}`}>Serie</label>
                        <input id={`serial-${n}`} name="serial" maxLength={60} className="input" />
                      </div>
                    </ActionForm>
                  </details>
                  <details>
                    <summary className="link cursor-pointer text-sm">Editar sede</summary>
                    <ActionForm action={updateSite.bind(null, customer.id, site.id)} submit="Guardar sede" className="mt-3 grid gap-4" buttonClassName="btn-dark">
                      <SiteFields prefix={`sede-${n}`} values={site} />
                    </ActionForm>
                    <ActionForm
                      action={deleteSite.bind(null, customer.id, site.id)}
                      confirm="¿Eliminar esta sede y sus equipos?"
                      submit="Eliminar sede"
                      pendingLabel="Eliminando…"
                      className="mt-3 grid gap-2"
                      buttonClassName="btn-outline text-[#9B1C1C]"
                    />
                  </details>
                </div>
              </article>
            ))}

            <details className="rounded-[12px] border border-dashed border-line p-4">
              <summary className="link cursor-pointer text-sm">{sites.data?.length ? "+ Agregar otra sede" : "+ Agregar sede"}</summary>
              <ActionForm action={addSite.bind(null, customer.id)} submit="Agregar sede" resetOnSuccess className="mt-4 grid gap-4" buttonClassName="btn-dark">
                <SiteFields prefix="nueva-sede" />
              </ActionForm>
            </details>
          </SectionCard>

          <SectionCard title="Historial de órdenes" bodyClassName="px-2 pt-3 pb-2">
            {!orders.data?.length ? (
              <p className="px-3 py-6 text-center text-sm text-muted">Este cliente aún no tiene órdenes.</p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <caption className="sr-only">Órdenes de {customer.name}</caption>
                  <thead>
                    <tr>
                      <th className="th">Orden</th>
                      <th className="th">Servicio</th>
                      <th className="th">Técnico</th>
                      <th className="th">Fecha</th>
                      <th className="th text-right">Total</th>
                      <th className="th">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.data.map((o) => {
                      const date = o.completed_at ?? o.scheduled_start;
                      return (
                        <tr key={o.id}>
                          <td className="td whitespace-nowrap">
                            <Link href={`/app/ordenes/${o.id}`} className="link">{orderCode(o.number)}</Link>
                          </td>
                          <td className="td">{o.title}</td>
                          <td className="td whitespace-nowrap">{o.memberships?.full_name ?? <span className="text-muted">Sin asignar</span>}</td>
                          <td className="td font-display tabular whitespace-nowrap">{date ? shortDate(date) : <span className="text-muted">Sin fecha</span>}</td>
                          <td className="td font-display tabular text-right whitespace-nowrap">{cop(o.total)}</td>
                          <td className="td"><StatusChip status={o.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <SectionCard title="Datos del cliente">
            <ActionForm action={updateCustomer.bind(null, customer.id)} submit="Guardar cambios" buttonClassName="btn-dark">
              <CustomerFields values={customer} />
            </ActionForm>
          </SectionCard>

          <SectionCard title="Cotizaciones" bodyClassName="px-5 py-3">
            {!quotes.data?.length ? (
              <p className="py-2 text-sm text-muted">Sin cotizaciones.</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {quotes.data.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span>
                      <Link href={`/app/cotizaciones/${q.id}`} className="link">{quoteCode(q.number)}</Link>
                      <span className="block text-xs text-muted">{shortDate(q.created_at)} · <span className="font-display tabular">{cop(q.total)}</span></span>
                    </span>
                    <QuoteChip status={q.status} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Eliminar cliente">
            <p className="mb-3 text-sm text-muted">Solo se puede eliminar un cliente sin órdenes ni cotizaciones.</p>
            <ActionForm
              action={deleteCustomer.bind(null, customer.id)}
              confirm={`¿Eliminar a ${customer.name} con sus sedes y equipos? No se puede deshacer.`}
              submit="Eliminar cliente"
              pendingLabel="Eliminando…"
              className="grid gap-3"
              buttonClassName="btn-outline text-[#9B1C1C]"
            />
          </SectionCard>
        </div>
      </div>
    </>
  );
}

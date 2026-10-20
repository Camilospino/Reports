import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Navigation, Star } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { StatusChip } from "@/components/ui/status-chip";
import { RealtimeRefresh } from "@/components/panel/realtime-refresh";
import { requireStaff } from "@/lib/session";
import { dateKeyOf } from "@/lib/agenda";
import { noticeText, siteUrl } from "@/lib/messages";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  bogotaDateKey,
  directionsLink,
  formatPhone,
  longDate,
  orderCode,
  shortDate,
  time,
  wazeLink,
  type WorkOrderStatus,
} from "@/lib/format";
import { OrderActions } from "./order-actions";
import { Checklist } from "./checklist";
import { Photos, type Photo } from "./photos";
import { ItemsTable } from "./items-table";
import { Notices } from "./notices";

const EVENT_LABELS: Record<string, string> = {
  creada: "Orden creada",
  asignada: "Técnico asignado",
  reprogramada: "Orden reprogramada",
  en_camino: "Técnico salió hacia el sitio",
  llegada: "Técnico llegó",
  checklist: "Avance en la lista de chequeo",
  facturada: "Orden facturada",
  nota: "Nota",
};

function eventLabel(type: string, payload: Record<string, unknown>) {
  if (type === "estado" && typeof payload.a === "string")
    return `Cambió a ${STATUS_LABELS[payload.a as WorkOrderStatus] ?? payload.a}`;
  if (type === "aviso_whatsapp") return payload.tipo === "reporte" ? "Reporte enviado por WhatsApp" : "Aviso de llegada por WhatsApp";
  return EVENT_LABELS[type] ?? type;
}

// Distancia en metros entre dos puntos (para "verificado por GPS").
function meters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}
const GPS_RADIUS_M = 300;

function dayWord(iso: string) {
  const d = dateKeyOf(iso);
  const today = bogotaDateKey();
  if (d === today) return "hoy";
  if (d === dateKeyOf(new Date(Date.now() + 86_400_000).toISOString())) return "mañana";
  if (d === dateKeyOf(new Date(Date.now() - 86_400_000).toISOString())) return "ayer";
  return `el ${longDate(iso).toLowerCase()}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, company } = await requireStaff();

  const { data: order } = await supabase
    .from("work_orders")
    .select(
      "*, customers(name, contact_name, phone_whatsapp), sites(address, neighborhood, city, lat, lng, access_notes), service_types(name, warranty_months), memberships(full_name, phone)",
    )
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!order) notFound();

  const [items, events, members, attachments, materials, technicians, rating] = await Promise.all([
    supabase.from("work_order_items").select("id, description, quantity, unit_price, total").eq("work_order_id", id).order("created_at").order("id"),
    supabase
      .from("work_order_events")
      .select("id, type, payload, user_id, lat, lng, created_at")
      .eq("work_order_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("memberships").select("user_id, full_name").eq("company_id", company.id),
    supabase
      .from("attachments")
      .select("id, kind, caption, storage_path, created_at")
      .eq("work_order_id", id)
      .in("kind", ["foto_antes", "foto_despues"])
      .order("created_at"),
    supabase.from("materials").select("id, name, unit, unit_price").eq("company_id", company.id).eq("active", true).order("name"),
    supabase
      .from("memberships")
      .select("id, full_name")
      .eq("company_id", company.id)
      .eq("role", "technician")
      .eq("active", true)
      .order("full_name"),
    supabase.from("work_order_ratings").select("stars, comment, created_at").eq("work_order_id", id).maybeSingle(),
  ]);

  // Fotos: URLs firmadas por 1 hora (el bucket es privado).
  const paths = (attachments.data ?? []).map((a) => a.storage_path);
  const signed = paths.length ? (await supabase.storage.from("evidencias").createSignedUrls(paths, 3600)).data ?? [] : [];
  const urlOf = new Map(signed.map((s) => [s.path, s.signedUrl]));
  const photos: Photo[] = (attachments.data ?? []).map((a) => ({
    id: a.id,
    kind: a.kind as Photo["kind"],
    url: urlOf.get(a.storage_path) ?? null,
    caption: a.caption || (a.kind === "foto_antes" ? "Antes" : "Después"),
  }));

  const nameOf = new Map((members.data ?? []).map((m) => [m.user_id, m.full_name]));
  const checklist = (Array.isArray(order.checklist_state) ? order.checklist_state : []) as { label: string; done: boolean }[];
  const site = order.sites;
  const allEvents = events.data ?? [];

  // Llegada del técnico: primer "llegada" o paso a "en proceso".
  const arrival = [...allEvents]
    .reverse()
    .find((e) => e.type === "llegada" || (e.type === "estado" && (e.payload as { a?: string })?.a === "en_proceso"));
  // Hora en que el técnico marcó "Llegué" en el celular (si lo hizo sin señal, sube después).
  const arrivalAt = arrival ? ((arrival.payload as { at?: string })?.at ?? arrival.created_at) : null;
  const gpsOk =
    arrival?.lat != null && arrival.lng != null && site?.lat != null && site.lng != null
      ? meters({ lat: arrival.lat, lng: arrival.lng }, { lat: site.lat, lng: site.lng }) <= GPS_RADIUS_M
      : null;

  // Avisos al cliente
  const contact = order.customers?.contact_name ?? order.customers?.name ?? "";
  const reportUrl = order.status === "completada" && order.public_token ? `${await siteUrl()}/r/${order.public_token}` : null;
  const noticeData = {
    contact,
    technician: order.memberships?.full_name ?? null,
    company: company.name,
    start: order.scheduled_start,
    reportUrl,
  };
  const sent = allEvents
    .filter((e) => e.type === "aviso_whatsapp")
    .reverse()
    .map((e) => ({
      id: e.id,
      text: String((e.payload as { mensaje?: string })?.mensaje ?? ""),
      meta: `${(e.user_id && nameOf.get(e.user_id)) || "Sistema"} · ${shortDate(e.created_at)}, ${time(e.created_at)}`,
    }));

  const warranty = order.service_types?.warranty_months;
  const invoiced = order.invoiced_at != null;
  const startKey = order.scheduled_start ? dateKeyOf(order.scheduled_start) : bogotaDateKey();

  return (
    <>
      <RealtimeRefresh companyId={company.id} tables={["work_orders", "work_order_ratings"]} />
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/ordenes" className="hover:underline">
          Órdenes
        </Link>{" "}
        / {orderCode(order.number)}
      </nav>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[30px] leading-tight font-bold tracking-[-0.02em]">{order.title}</h1>
            <StatusChip status={order.status} size="lg" />
          </div>
          <p className="mt-1 text-sm text-muted">
            {orderCode(order.number)} · {order.customers?.name}
            {order.scheduled_start
              ? ` · Programada ${dayWord(order.scheduled_start)} ${time(order.scheduled_start)}${
                  order.scheduled_end ? ` a ${time(order.scheduled_end)}` : ""
                }`
              : " · Sin programar"}
            {invoiced && ` · Facturada el ${shortDate(order.invoiced_at!)}`}
          </p>
        </div>
        <OrderActions
          orderId={order.id}
          canReassign={order.status === "pendiente" || order.status === "asignada"}
          canInvoice={order.status === "completada" && !invoiced}
          invoiced={invoiced}
          technicians={technicians.data ?? []}
          technicianId={order.technician_id}
          date={startKey}
          time={order.scheduled_start ? time(order.scheduled_start).padStart(5, "0") : "08:00"}
        />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-6">
          <section className="card grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            <Info label="Cliente" value={order.customers?.name}>
              {order.customers?.contact_name}
              {order.customers?.phone_whatsapp && ` · ${formatPhone(order.customers.phone_whatsapp)}`}
            </Info>
            <Info label="Dirección" value={site?.address ?? "Sin dirección"}>
              {[site?.neighborhood, site?.city].filter(Boolean).join(", ")}
              {site?.access_notes && <span className="block">{site.access_notes}</span>}
              {site?.lat != null && site?.lng != null && (
                <span className="mt-1 flex gap-3">
                  <a href={directionsLink(site.lat, site.lng)} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1">
                    <Navigation size={13} aria-hidden /> Google Maps
                  </a>
                  <a href={wazeLink(site.lat, site.lng)} target="_blank" rel="noopener noreferrer" className="link">
                    Waze
                  </a>
                </span>
              )}
            </Info>
            <Info label="Técnico" value={order.memberships?.full_name ?? "Sin asignar"}>
              {arrival
                ? `Llegó ${time(arrivalAt!)}${gpsOk === true ? " · verificado por GPS" : gpsOk === false ? " · lejos de la dirección" : ""}`
                : order.memberships?.phone
                  ? formatPhone(order.memberships.phone)
                  : null}
            </Info>
            <Info label="Tipo" value={order.service_types?.name ?? "Sin tipo"}>
              Prioridad {PRIORITY_LABELS[order.priority].toLowerCase()}
              {warranty ? ` · Garantía ${warranty} ${warranty === 1 ? "mes" : "meses"}` : ""}
            </Info>
          </section>

          {order.description && (
            <SectionCard title="Descripción">
              <p className="text-sm whitespace-pre-line">{order.description}</p>
            </SectionCard>
          )}

          <Checklist orderId={order.id} items={checklist} editable={order.status !== "cancelada" && !invoiced} />
          <Photos orderId={order.id} companyId={company.id} photos={photos} />
          <ItemsTable
            orderId={order.id}
            items={(items.data ?? []).map((i) => ({
              id: i.id,
              description: i.description,
              quantity: Number(i.quantity),
              unit_price: Number(i.unit_price),
              total: Number(i.total),
            }))}
            total={Number(order.total)}
            materials={(materials.data ?? []).map((m) => ({ ...m, unit_price: Number(m.unit_price) }))}
            locked={invoiced}
          />
        </div>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6 xl:max-w-[320px]">
          {reportUrl && (
            <SectionCard title="Reporte al cliente">
              {rating.data ? (
                <>
                  <p className="flex items-center gap-1" role="img" aria-label={`Calificó ${rating.data.stars} de 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={20} aria-hidden className={n <= rating.data!.stars ? "text-accent" : "text-line"} fill="currentColor" />
                    ))}
                    <span className="ml-1 text-sm text-muted">{shortDate(rating.data.created_at)}</span>
                  </p>
                  {rating.data.comment && <p className="mt-2 text-sm whitespace-pre-line">“{rating.data.comment}”</p>}
                </>
              ) : (
                <p className="text-sm text-muted">El cliente todavía no ha calificado el servicio.</p>
              )}
              <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="link mt-3 inline-flex items-center gap-1.5 text-sm">
                Ver reporte <ExternalLink size={14} aria-hidden />
              </a>
            </SectionCard>
          )}
          <SectionCard title="Historial">
            <ol>
              {allEvents.map((e, i, all) => (
                <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < all.length - 1 && <span aria-hidden className="absolute top-3 left-[5px] h-full w-0.5 bg-line" />}
                  <span
                    aria-hidden
                    className={`relative mt-1 size-3 shrink-0 rounded-full ${i === 0 ? "bg-primary ring-4 ring-primary-soft" : "bg-ink"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{eventLabel(e.type, (e.payload ?? {}) as Record<string, unknown>)}</p>
                    <p className="text-[13px] text-muted">
                      {(e.user_id && nameOf.get(e.user_id)) || "Sistema"} ·{" "}
                      {dateKeyOf(e.created_at) === bogotaDateKey() ? time(e.created_at) : `${shortDate(e.created_at)}, ${time(e.created_at)}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>

          <Notices
            orderId={order.id}
            phone={order.customers?.phone_whatsapp ?? null}
            sent={sent}
            onTheWay={noticeText("en_camino", noticeData)!}
            report={noticeText("reporte", noticeData)}
          />
        </div>
      </div>
    </>
  );
}

function Info({ label, value, children }: { label: string; value: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold tracking-[0.04em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
      {children && <div className="mt-0.5 text-sm text-muted">{children}</div>}
    </div>
  );
}

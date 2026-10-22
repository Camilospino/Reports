import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { requireStaff } from "@/lib/session";
import { STATUS_LABELS, bogotaDayRange, orderCode, shortDate, time, type WorkOrderStatus } from "@/lib/format";

export const metadata = { title: "Órdenes · Tecnio" };

type Search = { q?: string; estado?: string; tecnico?: string; fecha?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Quita caracteres que tienen significado en los filtros de PostgREST.
const clean = (s: string) => s.replace(/[,()*%\\:"]/g, " ").trim();

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase, company } = await requireStaff();
  const params = await searchParams;
  const q = clean(params.q ?? "");
  const estado = params.estado && params.estado in STATUS_LABELS ? (params.estado as WorkOrderStatus) : undefined;
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(params.fecha ?? "") ? params.fecha : undefined;
  const tecnico = params.tecnico === "sin" || UUID.test(params.tecnico ?? "") ? params.tecnico : undefined;

  // Se lanza ya y se espera junto con las órdenes.
  const techniciansQuery = supabase
    .from("memberships")
    .select("id, full_name")
    .eq("company_id", company.id)
    .eq("role", "technician")
    .order("full_name");

  let query = supabase
    .from("work_orders")
    .select("id, number, status, title, scheduled_start, customers(name), sites(neighborhood), memberships(full_name)")
    .eq("company_id", company.id)
    .order("scheduled_start", { ascending: false, nullsFirst: true })
    .limit(100);

  if (estado) query = query.eq("status", estado);
  if (tecnico === "sin") query = query.is("technician_id", null);
  else if (tecnico) query = query.eq("technician_id", tecnico);
  if (fecha) {
    const { start, end } = bogotaDayRange(fecha);
    query = query.gte("scheduled_start", start).lt("scheduled_start", end);
  }

  if (q) {
    const number = q.match(/^(?:ot-?)?\s*(\d+)$/i)?.[1];
    if (number) {
      query = query.eq("number", Number(number));
    } else {
      const [customers, techs] = await Promise.all([
        supabase.from("customers").select("id").eq("company_id", company.id).ilike("name", `%${q}%`).limit(50),
        supabase.from("memberships").select("id").eq("company_id", company.id).ilike("full_name", `%${q}%`).limit(50),
      ]);
      const ors = [`title.ilike.*${q}*`];
      const cIds = customers.data?.map((c) => c.id) ?? [];
      const tIds = techs.data?.map((t) => t.id) ?? [];
      if (cIds.length) ors.push(`customer_id.in.(${cIds.join(",")})`);
      if (tIds.length) ors.push(`technician_id.in.(${tIds.join(",")})`);
      query = query.or(ors.join(","));
    }
  }

  const [{ data: orders, error }, { data: technicians }] = await Promise.all([query, techniciansQuery]);
  if (error) throw new Error(error.message);
  const filtering = Boolean(q || estado || tecnico || fecha);

  return (
    <>
      <PageHeader
        title="Órdenes"
        description="Todas las órdenes de trabajo de tu empresa."
        actions={
          <Link href="/app/ordenes/nueva" className="btn-accent">
            <Plus size={18} aria-hidden /> Nueva orden
          </Link>
        }
      />

      <form className="card mb-5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] sm:items-end" role="search">
        <div>
          <label className="label" htmlFor="q">Buscar</label>
          <input id="q" name="q" type="search" defaultValue={params.q} placeholder="OT-1038, cliente o técnico" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="estado">Estado</label>
          <select id="estado" name="estado" defaultValue={estado ?? ""} className="input">
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tecnico">Técnico</label>
          <select id="tecnico" name="tecnico" defaultValue={tecnico ?? ""} className="input">
            <option value="">Todos</option>
            <option value="sin">Sin asignar</option>
            {technicians?.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="fecha">Fecha</label>
          <input id="fecha" name="fecha" type="date" defaultValue={fecha} className="input" />
        </div>
        <div className="flex gap-2">
          <button className="btn-dark flex-1">Filtrar</button>
          {filtering && <Link href="/app/ordenes" className="btn-outline">Limpiar</Link>}
        </div>
      </form>

      <section className="card px-2 pt-3 pb-2">
        {!orders?.length ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm text-muted">
              {filtering ? "No hay órdenes con esos filtros." : "Aún no tienes órdenes. Crea la primera."}
            </p>
            {!filtering && (
              <Link href="/app/ordenes/nueva" className="btn-accent mt-4">
                <Plus size={18} aria-hidden /> Nueva orden
              </Link>
            )}
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">Órdenes de trabajo</caption>
              <thead>
                <tr>
                  <th className="th">Orden</th>
                  <th className="th">Cliente</th>
                  <th className="th">Servicio</th>
                  <th className="th">Técnico</th>
                  <th className="th">Fecha</th>
                  <th className="th">Estado</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="td whitespace-nowrap">
                      <Link href={`/app/ordenes/${o.id}`} className="link">{orderCode(o.number)}</Link>
                    </td>
                    <td className="td">
                      <p className="font-medium">{o.customers?.name}</p>
                      {o.sites?.neighborhood && <p className="text-xs text-muted">{o.sites.neighborhood}</p>}
                    </td>
                    <td className="td">{o.title}</td>
                    <td className="td whitespace-nowrap">{o.memberships?.full_name ?? <span className="text-muted">Sin asignar</span>}</td>
                    <td className="td font-display tabular whitespace-nowrap">
                      {o.scheduled_start ? `${shortDate(o.scheduled_start)} · ${time(o.scheduled_start)}` : <span className="text-muted">Sin fecha</span>}
                    </td>
                    <td className="td"><StatusChip status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

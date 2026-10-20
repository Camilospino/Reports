import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaff } from "@/lib/session";
import { cop, formatPhone, shortDate } from "@/lib/format";

export const metadata = { title: "Clientes · Tecnio" };

// Quita caracteres que tienen significado en los filtros de PostgREST.
const clean = (s: string) => s.replace(/[,()*%\\:"]/g, " ").trim();
const LIMIT = 200;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase, company } = await requireStaff();
  const params = await searchParams;
  const q = clean(params.q ?? "");

  let query = supabase
    .from("customers")
    .select("id, name, contact_name, phone_whatsapp, sites(neighborhood, city)", { count: "exact" })
    .eq("company_id", company.id)
    .order("name")
    .limit(LIMIT);
  if (q) {
    const digits = q.replace(/\D/g, "");
    const ors = [`name.ilike.*${q}*`, `contact_name.ilike.*${q}*`, `tax_id.ilike.*${q}*`];
    if (digits.length >= 3) ors.push(`phone_whatsapp.ilike.*${digits}*`);
    query = query.or(ors.join(","));
  }
  const { data: customers, count, error } = await query;
  if (error) throw new Error(error.message);

  const ids = customers?.map((c) => c.id) ?? [];
  const { data: stats } = ids.length
    ? await supabase.from("customer_stats").select("customer_id, orders, open_orders, last_service, billed").in("customer_id", ids)
    : { data: [] };
  const statsOf = new Map(stats?.map((s) => [s.customer_id, s]));

  return (
    <>
      <PageHeader
        title="Clientes"
        description={count ? `${count} ${count === 1 ? "cliente" : "clientes"} con sus sedes y equipos.` : "Tus clientes, sus sedes y sus equipos."}
        actions={
          <Link href="/app/clientes/nuevo" className="btn-accent">
            <Plus size={18} aria-hidden /> Nuevo cliente
          </Link>
        }
      />

      <form className="card mb-5 flex flex-wrap items-end gap-3" role="search">
        <div className="min-w-0 flex-1 basis-60">
          <label className="label" htmlFor="q">Buscar</label>
          <input id="q" name="q" type="search" defaultValue={params.q} placeholder="Nombre, contacto, NIT o celular" className="input" />
        </div>
        <button className="btn-dark">Buscar</button>
        {q && <Link href="/app/clientes" className="btn-outline">Limpiar</Link>}
      </form>

      <section className="card px-2 pt-3 pb-2">
        {!customers?.length ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm text-muted">
              {q ? "No hay clientes que coincidan con la búsqueda." : "Aún no tienes clientes. Crea el primero; también se crean al hacer una orden."}
            </p>
            {!q && (
              <Link href="/app/clientes/nuevo" className="btn-accent mt-4">
                <Plus size={18} aria-hidden /> Nuevo cliente
              </Link>
            )}
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <caption className="sr-only">Clientes</caption>
              <thead>
                <tr>
                  <th className="th">Cliente</th>
                  <th className="th">WhatsApp</th>
                  <th className="th">Sedes</th>
                  <th className="th text-right">Órdenes</th>
                  <th className="th">Último servicio</th>
                  <th className="th text-right">Facturado</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const s = statsOf.get(c.id);
                  const places = [...new Set(c.sites.map((x) => x.neighborhood ?? x.city).filter(Boolean))];
                  return (
                    <tr key={c.id}>
                      <td className="td">
                        <Link href={`/app/clientes/${c.id}`} className="link">{c.name}</Link>
                        {c.contact_name && <p className="text-xs text-muted">{c.contact_name}</p>}
                      </td>
                      <td className="td whitespace-nowrap">{formatPhone(c.phone_whatsapp)}</td>
                      <td className="td">
                        {c.sites.length ? (
                          <>
                            {c.sites.length}
                            {places.length > 0 && <span className="text-muted"> · {places.slice(0, 2).join(", ")}</span>}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="td font-display tabular text-right">
                        {s?.orders ?? 0}
                        {s?.open_orders ? <span className="block text-xs font-normal text-muted">{s.open_orders} abiertas</span> : null}
                      </td>
                      <td className="td font-display tabular whitespace-nowrap">
                        {s?.last_service ? shortDate(s.last_service) : <span className="text-muted">—</span>}
                      </td>
                      <td className="td font-display tabular text-right whitespace-nowrap">{cop(s?.billed)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(count ?? 0) > LIMIT && (
              <p className="px-3 pt-3 pb-1 text-sm text-muted">Mostrando {LIMIT} de {count}. Busca por nombre para encontrar a los demás.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}

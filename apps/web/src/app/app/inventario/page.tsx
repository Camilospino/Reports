import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { RealtimeRefresh } from "@/components/panel/realtime-refresh";
import { requireStaff } from "@/lib/session";
import { cop, copMillions, duration, qty } from "@/lib/format";

export const metadata = { title: "Inventario · Tecnio" };

type Search = { tab?: string; q?: string; archivados?: string; bajos?: string };

const clean = (s: string) => s.replace(/[,()*%\\:"]/g, " ").trim();

function Tabs({ tab }: { tab: "materiales" | "servicios" }) {
  const item = (key: typeof tab, href: string, label: string) => (
    <Link
      href={href}
      aria-current={tab === key ? "page" : undefined}
      className={`-mb-px inline-flex h-11 items-center border-b-2 px-4 text-sm font-semibold ${
        tab === key ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Catálogo" className="mb-5 flex gap-1 border-b border-line">
      {item("materiales", "/app/inventario", "Materiales")}
      {item("servicios", "/app/inventario?tab=servicios", "Tipos de servicio")}
    </nav>
  );
}

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  return params.tab === "servicios" ? <Services /> : <Materials params={params} />;
}

async function Materials({ params }: { params: Search }) {
  const { supabase, company } = await requireStaff();
  const q = clean(params.q ?? "");
  const archived = params.archivados === "1";
  const lowOnly = params.bajos === "1";

  let query = supabase
    .from("materials")
    .select("id, name, sku, unit, unit_price, stock, min_stock, track_stock, active")
    .eq("company_id", company.id)
    .eq("active", !archived)
    .order("name");
  if (q) query = query.or(`name.ilike.*${q}*,sku.ilike.*${q}*`);
  const [{ data: all, error }, { count: archivedCount }] = await Promise.all([
    query,
    supabase.from("materials").select("id", { count: "exact", head: true }).eq("company_id", company.id).eq("active", false),
  ]);
  if (error) throw new Error(error.message);

  const isLow = (m: NonNullable<typeof all>[number]) => m.track_stock && Number(m.min_stock) > 0 && Number(m.stock) <= Number(m.min_stock);
  const materials = lowOnly ? all?.filter(isLow) : all;
  const tracked = (all ?? []).filter((m) => m.track_stock);
  const low = (all ?? []).filter(isLow).length;
  const value = tracked.reduce((n, m) => n + Math.max(0, Number(m.stock)) * Number(m.unit_price), 0);
  const filtering = Boolean(q || lowOnly);

  return (
    <>
      <RealtimeRefresh tables={["materials"]} companyId={company.id} />
      <PageHeader
        title="Inventario"
        description="Materiales con su precio y stock, y los tipos de servicio que ofreces."
        actions={
          <Link href="/app/inventario/nuevo" className="btn-accent">
            <Plus size={18} aria-hidden /> Nuevo material
          </Link>
        }
      />
      <Tabs tab="materiales" />

      {!archived && (
        <div className="mb-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          <StatCard label="Materiales" value={all?.length ?? 0} detail={`${tracked.length} con control de stock`} />
          <StatCard
            label="Bajos de stock"
            value={low}
            detail={low ? <Link href="/app/inventario?bajos=1" className="link">Ver cuáles</Link> : "Todo en orden"}
          />
          <StatCard label="Valor del inventario" value={copMillions(value)} detail="Stock × precio de venta" />
        </div>
      )}

      <form className="card mb-5 flex flex-wrap items-end gap-3" role="search">
        {archived && <input type="hidden" name="archivados" value="1" />}
        <div className="min-w-0 flex-1 basis-60">
          <label className="label" htmlFor="q">Buscar</label>
          <input id="q" name="q" type="search" defaultValue={params.q} placeholder="Nombre o referencia" className="input" />
        </div>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="bajos" value="1" defaultChecked={lowOnly} className="size-5 accent-[var(--primary)]" />
          Solo bajos de stock
        </label>
        <button className="btn-dark">Buscar</button>
        {filtering && <Link href={archived ? "/app/inventario?archivados=1" : "/app/inventario"} className="btn-outline">Limpiar</Link>}
      </form>

      <section className="card px-2 pt-3 pb-2">
        {archived && (
          <p className="px-3 pb-3 text-sm">
            Materiales archivados: no aparecen al agregar materiales a órdenes o cotizaciones.{" "}
            <Link href="/app/inventario" className="link">Volver a los activos</Link>
          </p>
        )}
        {!materials?.length ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm text-muted">
              {filtering
                ? "No hay materiales con esos filtros."
                : archived
                  ? "No hay materiales archivados."
                  : "Aún no tienes materiales. Agrégalos para que los técnicos los registren al cerrar una orden."}
            </p>
            {!filtering && !archived && (
              <Link href="/app/inventario/nuevo" className="btn-accent mt-4">
                <Plus size={18} aria-hidden /> Nuevo material
              </Link>
            )}
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <caption className="sr-only">Materiales</caption>
              <thead>
                <tr>
                  <th className="th">Material</th>
                  <th className="th">Unidad</th>
                  <th className="th text-right">Precio</th>
                  <th className="th text-right">Stock</th>
                  <th className="th text-right">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="td">
                      <Link href={`/app/inventario/${m.id}`} className="link">{m.name}</Link>
                      {m.sku && <p className="text-xs text-muted">Ref. {m.sku}</p>}
                    </td>
                    <td className="td">{m.unit}</td>
                    <td className="td font-display tabular text-right whitespace-nowrap">{cop(m.unit_price)}</td>
                    <td className="td font-display tabular text-right whitespace-nowrap">
                      {!m.track_stock ? (
                        <span className="font-sans text-muted">No aplica</span>
                      ) : isLow(m) ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 font-semibold text-[#A33A0B]">
                          {qty(m.stock)} <span className="font-sans text-xs">· bajo</span>
                        </span>
                      ) : (
                        qty(m.stock)
                      )}
                    </td>
                    <td className="td font-display tabular text-right text-muted">{m.track_stock ? qty(m.min_stock) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!archived && Boolean(archivedCount) && (
        <p className="mt-4 text-sm text-muted">
          <Link href="/app/inventario?archivados=1" className="link">
            Ver {archivedCount} {archivedCount === 1 ? "material archivado" : "materiales archivados"}
          </Link>
        </p>
      )}
    </>
  );
}

async function Services() {
  const { supabase, company } = await requireStaff();
  const { data: services, error } = await supabase
    .from("service_types")
    .select("id, name, estimated_minutes, checklist, skill, warranty_months, active")
    .eq("company_id", company.id)
    .order("active", { ascending: false })
    .order("name");
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Materiales con su precio y stock, y los tipos de servicio que ofreces."
        actions={
          <Link href="/app/inventario/servicios/nuevo" className="btn-accent">
            <Plus size={18} aria-hidden /> Nuevo servicio
          </Link>
        }
      />
      <Tabs tab="servicios" />

      <section className="card px-2 pt-3 pb-2">
        {!services?.length ? (
          <div className="px-3 py-10 text-center">
            <p className="text-sm text-muted">
              Aún no tienes tipos de servicio. Con ellos cada orden trae su duración, su garantía y su lista de chequeo.
            </p>
            <Link href="/app/inventario/servicios/nuevo" className="btn-accent mt-4">
              <Plus size={18} aria-hidden /> Nuevo servicio
            </Link>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">Tipos de servicio</caption>
              <thead>
                <tr>
                  <th className="th">Servicio</th>
                  <th className="th">Duración</th>
                  <th className="th">Especialidad</th>
                  <th className="th">Garantía</th>
                  <th className="th text-right">Pasos</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="td">
                      <Link href={`/app/inventario/servicios/${s.id}`} className="link">{s.name}</Link>
                      {!s.active && <span className="ml-2 rounded-full bg-line-soft px-2 py-0.5 text-xs font-semibold text-muted">Archivado</span>}
                    </td>
                    <td className="td font-display tabular whitespace-nowrap">{duration(s.estimated_minutes * 60_000)}</td>
                    <td className="td">{s.skill ?? <span className="text-muted">—</span>}</td>
                    <td className="td whitespace-nowrap">
                      {s.warranty_months ? `${s.warranty_months} ${s.warranty_months === 1 ? "mes" : "meses"}` : <span className="text-muted">—</span>}
                    </td>
                    <td className="td font-display tabular text-right">{Array.isArray(s.checklist) ? s.checklist.length : 0}</td>
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { RealtimeRefresh } from "@/components/panel/realtime-refresh";
import { requireStaff } from "@/lib/session";
import { UUID_RE, cop, qty, shortDate, time } from "@/lib/format";
import { adjustStock, setMaterialActive, updateMaterial } from "../actions";
import { MaterialFields } from "../fields";

export const metadata = { title: "Material · Tecnio" };

export default async function MaterialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { supabase, company } = await requireStaff();

  const { data: m } = await supabase
    .from("materials")
    .select("id, name, sku, unit, unit_price, stock, min_stock, track_stock, active")
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!m) notFound();

  const [{ data: movements }, { data: members }] = await Promise.all([
    supabase
      .from("stock_movements")
      .select("id, delta, stock_after, reason, work_order_id, user_id, created_at")
      .eq("company_id", company.id)
      .eq("material_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("memberships").select("user_id, full_name").eq("company_id", company.id),
  ]);
  const who = new Map(members?.map((x) => [x.user_id, x.full_name]));
  const stock = Number(m.stock);
  const low = m.track_stock && Number(m.min_stock) > 0 && stock <= Number(m.min_stock);
  const isNew = (await searchParams).nuevo === "1";

  return (
    <>
      <RealtimeRefresh tables={["materials"]} companyId={company.id} />
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/inventario" className="hover:underline">Inventario</Link> / {m.name}
      </nav>
      <PageHeader
        title={m.name}
        description={[m.sku && `Ref. ${m.sku}`, `${cop(m.unit_price)} por ${m.unit}`, m.active ? null : "Archivado"].filter(Boolean).join(" · ")}
      />
      {isNew && (
        <p role="status" className="mb-5 rounded-[10px] bg-primary-soft px-3 py-2.5 text-sm text-primary">
          Material creado. Ya aparece en las órdenes, las cotizaciones y la app de los técnicos.
        </p>
      )}

      {m.track_stock && (
        <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
          <StatCard
            label="Stock"
            value={qty(stock)}
            suffix={m.unit}
            detail={low ? <span className="font-semibold text-accent">Bajo el mínimo ({qty(m.min_stock)})</span> : `Mínimo ${qty(m.min_stock)}`}
          />
          <StatCard label="Valor en bodega" value={cop(Math.max(0, stock) * Number(m.unit_price))} detail="Stock × precio de venta" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {m.track_stock && (
            <SectionCard title="Registrar movimiento">
              <ActionForm action={adjustStock.bind(null, m.id)} submit="Registrar" resetOnSuccess className="grid gap-4 sm:grid-cols-2">
                <fieldset className="sm:col-span-2">
                  <legend className="label">Tipo</legend>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["entrada", "Entrada", "Compra o devolución"],
                      ["salida", "Salida", "Daño, pérdida o uso sin orden"],
                      ["conteo", "Conteo físico", "Corrige al valor contado"],
                    ].map(([value, label, hint], i) => (
                      <label key={value} className="flex min-w-36 flex-1 cursor-pointer items-start gap-2 rounded-[10px] border border-line p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                        <input type="radio" name="kind" value={value} defaultChecked={i === 0} required className="mt-0.5 accent-[var(--primary)]" />
                        <span className="text-sm">
                          <span className="font-semibold">{label}</span>
                          <span className="block text-xs text-muted">{hint}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label className="label" htmlFor="quantity">Cantidad ({m.unit})</label>
                  <input id="quantity" name="quantity" required inputMode="decimal" className="input font-display tabular" />
                </div>
                <div>
                  <label className="label" htmlFor="note">Nota <span className="font-normal text-muted">(opcional)</span></label>
                  <input id="note" name="note" maxLength={120} placeholder="Factura 4521, proveedor" className="input" />
                </div>
              </ActionForm>
              <p className="mt-3 text-xs text-muted">Los materiales de una orden se descuentan solos cuando el técnico la cierra.</p>
            </SectionCard>
          )}

          <SectionCard title="Datos del material">
            <ActionForm action={updateMaterial.bind(null, m.id)} submit="Guardar cambios" buttonClassName="btn-dark">
              <MaterialFields values={{ ...m, unit_price: Number(m.unit_price), min_stock: Number(m.min_stock) }} />
            </ActionForm>
          </SectionCard>

          <SectionCard title={m.active ? "Archivar material" : "Material archivado"}>
            <p className="mb-3 text-sm text-muted">
              {m.active
                ? "Si ya no lo vendes, archívalo: deja de aparecer al agregar materiales, pero las órdenes viejas lo conservan."
                : "No aparece al agregar materiales. Puedes devolverlo al catálogo cuando quieras."}
            </p>
            <ActionForm
              action={setMaterialActive.bind(null, m.id, !m.active)}
              submit={m.active ? "Archivar" : "Volver al catálogo"}
              className="grid gap-3"
              buttonClassName="btn-outline"
            />
          </SectionCard>
        </div>

        <SectionCard title="Movimientos" bodyClassName="px-2 pt-3 pb-2" className="self-start">
          {!movements?.length ? (
            <p className="px-3 py-6 text-center text-sm text-muted">Sin movimientos de stock.</p>
          ) : (
            // Enfocable: en celular la tabla se desplaza de lado y se debe poder mover con el teclado.
            <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Movimientos de stock">
              <table className="w-full min-w-[420px] text-sm">
                <caption className="sr-only">Movimientos de stock de {m.name}</caption>
                <thead>
                  <tr>
                    <th className="th">Fecha</th>
                    <th className="th">Motivo</th>
                    <th className="th text-right">Cambio</th>
                    <th className="th text-right">Queda</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mv) => {
                    const d = Number(mv.delta);
                    return (
                      <tr key={mv.id}>
                        <td className="td font-display tabular whitespace-nowrap">
                          {shortDate(mv.created_at)}
                          <span className="block text-xs font-normal text-muted">{time(mv.created_at)}</span>
                        </td>
                        <td className="td">
                          {mv.work_order_id ? (
                            <Link href={`/app/ordenes/${mv.work_order_id}`} className="link">{mv.reason}</Link>
                          ) : (
                            mv.reason
                          )}
                          {mv.user_id && who.get(mv.user_id) && <span className="block text-xs text-muted">{who.get(mv.user_id)}</span>}
                        </td>
                        <td className={`td font-display tabular text-right font-semibold whitespace-nowrap ${d > 0 ? "text-primary" : "text-accent"}`}>
                          {d > 0 ? "+" : "−"}
                          {qty(Math.abs(d))}
                        </td>
                        <td className="td font-display tabular text-right">{qty(mv.stock_after)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}

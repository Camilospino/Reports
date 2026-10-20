import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { requireStaff } from "@/lib/session";
import { TZ, bogotaDateKey, cop } from "@/lib/format";

export const metadata = { title: "Reportes · Tecnio" };

const monthName = (d: Date) => new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: TZ }).format(d);

type Row = {
  total: number | null;
  technician_id: string | null;
  memberships: { full_name: string } | null;
  service_types: { name: string } | null;
};

export default async function ReportsPage() {
  const { supabase, company } = await requireStaff();
  const now = new Date();

  // Rango del mes actual en hora de Bogotá (Colombia es UTC-5 todo el año).
  const [year, month] = bogotaDateKey(now).split("-").map(Number);
  const monthStart = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-05:00`);
  const nextMonth = new Date(`${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01T00:00:00-05:00`);

  // "Facturado" = órdenes marcadas como facturadas este mes (igual que el inicio).
  // "Pendiente por facturar" = órdenes completadas que aún no se facturan.
  const [invoiced, pending] = await Promise.all([
    supabase
      .from("work_orders")
      .select("total, technician_id, memberships(full_name), service_types(name)")
      .eq("company_id", company.id)
      .gte("invoiced_at", monthStart.toISOString())
      .lt("invoiced_at", nextMonth.toISOString()),
    supabase
      .from("work_orders")
      .select("total")
      .eq("company_id", company.id)
      .eq("status", "completada")
      .is("invoiced_at", null),
  ]);
  if (invoiced.error) throw new Error(invoiced.error.message);
  if (pending.error) throw new Error(pending.error.message);

  const rows = (invoiced.data ?? []) as Row[];
  const billed = rows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);
  const avg = rows.length ? billed / rows.length : 0;
  const pendingRows = pending.data ?? [];
  const pendingTotal = pendingRows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);

  const tally = (key: (r: Row) => string) => {
    const map = new Map<string, { count: number; total: number }>();
    for (const r of rows) {
      const k = key(r);
      const v = map.get(k) ?? { count: 0, total: 0 };
      v.count += 1;
      v.total += Number(r.total ?? 0);
      map.set(k, v);
    }
    return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total);
  };

  const byTech = tally((r) => r.memberships?.full_name ?? "Sin asignar");
  const byService = tally((r) => r.service_types?.name ?? "Otro");

  return (
    <>
      <PageHeader title="Reportes" description={`Facturación y desempeño · ${monthName(now)}`} />

      <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
        <StatCard label="Facturado del mes" value={cop(billed)} detail="Órdenes facturadas este mes" />
        <StatCard label="Órdenes facturadas" value={rows.length} detail="En el mes en curso" />
        <StatCard label="Ticket promedio" value={cop(avg)} detail="Por orden facturada" />
        <StatCard
          label="Pendiente por facturar"
          value={cop(pendingTotal)}
          detail={pendingRows.length ? `${pendingRows.length} órdenes completadas sin facturar` : "Todo al día"}
        />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <SectionCard title="Por técnico" className="flex-[1_1_380px]" bodyClassName="px-2 pt-3 pb-2">
          <ReportTable rows={byTech} firstLabel="Técnico" empty="Aún no hay órdenes facturadas este mes." />
        </SectionCard>
        <SectionCard title="Por tipo de servicio" className="flex-[1_1_380px]" bodyClassName="px-2 pt-3 pb-2">
          <ReportTable rows={byService} firstLabel="Servicio" empty="Aún no hay órdenes facturadas este mes." />
        </SectionCard>
      </div>
    </>
  );
}

function ReportTable({
  rows,
  firstLabel,
  empty,
}: {
  rows: { name: string; count: number; total: number }[];
  firstLabel: string;
  empty: string;
}) {
  if (!rows.length) return <p className="px-3 py-8 text-center text-sm text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="th">{firstLabel}</th>
            <th className="th text-right">Órdenes</th>
            <th className="th text-right">Facturado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="td font-medium">{r.name}</td>
              <td className="td font-display tabular text-right">{r.count}</td>
              <td className="td font-display tabular text-right">{cop(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

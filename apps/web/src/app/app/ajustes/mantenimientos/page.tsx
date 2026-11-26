import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { bogotaDateKey, dayLabel, installationCode } from "@/lib/format";
import { requireOwner } from "@/lib/session";
import { MaintenanceForm } from "./maintenance-form";

export const metadata = { title: "Mantenimientos programados · Tecnio" };

export default async function MaintenanceSettingsPage() {
  const { supabase, company } = await requireOwner();
  const today = bogotaDateKey();
  const [settings, upcoming] = await Promise.all([
    supabase.from("companies").select("auto_maintenance_days").eq("id", company.id).single(),
    supabase
      .from("installations")
      .select("id, number, name, next_maintenance, customers(name)")
      .eq("company_id", company.id)
      .eq("status", "activa")
      .not("next_maintenance", "is", null)
      .order("next_maintenance")
      .limit(15),
  ]);

  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/ajustes" className="hover:underline">Ajustes</Link> / Mantenimientos programados
      </nav>
      <PageHeader
        title="Mantenimientos programados"
        description="La frecuencia de cada instalación se define en su detalle; aquí decides si las órdenes se crean solas."
      />
      <section className="card max-w-2xl">
        <MaintenanceForm days={settings.data?.auto_maintenance_days ?? null} />
      </section>

      <section className="card mt-6 max-w-2xl p-0">
        <h2 className="px-5 pt-4 font-display font-bold">Próximos mantenimientos</h2>
        {upcoming.data?.length ? (
          <ul>
            {upcoming.data.map((i) => (
              <li key={i.id} className="border-t border-line-soft first:border-t-0">
                <Link href={`/app/instalaciones/${i.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-bg">
                  <span className="flex-1">
                    <span className="block font-semibold">{i.name}</span>
                    <span className="block text-sm text-muted">
                      {installationCode(i.number)} · {i.customers?.name}
                    </span>
                  </span>
                  <span className={`text-sm ${i.next_maintenance! < today ? "font-semibold text-[#9B1C1C]" : "text-muted"}`}>
                    {i.next_maintenance! < today ? "Vencido · " : ""}
                    {dayLabel(i.next_maintenance!)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 pb-5 pt-2 text-sm text-muted">
            Ninguna instalación tiene plan de mantenimiento. Ponle una frecuencia desde el detalle de la instalación.
          </p>
        )}
      </section>
    </>
  );
}

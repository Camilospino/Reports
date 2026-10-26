import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaff } from "@/lib/session";
import { UUID_RE, bogotaDateKey, installationCode } from "@/lib/format";
import { NewOrderForm } from "./new-order-form";

export const metadata = { title: "Nueva orden · Tecnio" };

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ cliente?: string; instalacion?: string; mantenimiento?: string; fecha?: string }> }) {
  const { supabase, company } = await requireStaff();
  const { cliente, instalacion, mantenimiento, fecha } = await searchParams;
  const [customers, sites, assets, serviceTypes, technicians, installation] = await Promise.all([
    supabase.from("customers").select("id, name").eq("company_id", company.id).order("name"),
    supabase.from("sites").select("id, customer_id, address, neighborhood").eq("company_id", company.id).order("created_at"),
    supabase.from("assets").select("id, site_id, type, brand, model").eq("company_id", company.id),
    supabase.from("service_types").select("id, name, estimated_minutes, checklist, is_maintenance").eq("company_id", company.id).eq("active", true).order("name"),
    supabase
      .from("memberships")
      .select("id, full_name")
      .eq("company_id", company.id)
      .eq("role", "technician")
      .eq("active", true)
      .order("full_name"),
    // "Nueva orden aquí" y "Programar mantenimiento" desde el detalle de una instalación.
    instalacion && UUID_RE.test(instalacion)
      ? supabase.from("installations").select("id, number, name, customer_id, site_id").eq("id", instalacion).eq("company_id", company.id).maybeSingle()
      : null,
  ]);
  const ins = installation?.data;
  const today = bogotaDateKey();
  const maintenanceType = mantenimiento ? serviceTypes.data?.find((s) => s.is_maintenance) : undefined;

  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/ordenes" className="hover:underline">Órdenes</Link> / Nueva
      </nav>
      <PageHeader title="Nueva orden" />
      <NewOrderForm
        today={today}
        initialCustomerId={ins?.customer_id ?? (customers.data?.some((c) => c.id === cliente) ? cliente : undefined)}
        installation={ins ? { id: ins.id, label: `${installationCode(ins.number)} · ${ins.name}`, customer_id: ins.customer_id, site_id: ins.site_id } : undefined}
        initialServiceTypeId={maintenanceType?.id}
        initialDate={fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha >= today ? fecha : undefined}
        customers={customers.data ?? []}
        sites={sites.data ?? []}
        assets={assets.data ?? []}
        serviceTypes={(serviceTypes.data ?? []).map((s) => ({
          ...s,
          checklist: Array.isArray(s.checklist) ? s.checklist.map(String) : [],
        }))}
        technicians={technicians.data ?? []}
      />
    </>
  );
}

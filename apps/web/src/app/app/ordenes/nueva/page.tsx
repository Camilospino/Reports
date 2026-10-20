import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaff } from "@/lib/session";
import { bogotaDateKey } from "@/lib/format";
import { NewOrderForm } from "./new-order-form";

export const metadata = { title: "Nueva orden · Tecnio" };

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  const { supabase, company } = await requireStaff();
  const { cliente } = await searchParams;
  const [customers, sites, assets, serviceTypes, technicians] = await Promise.all([
    supabase.from("customers").select("id, name").eq("company_id", company.id).order("name"),
    supabase.from("sites").select("id, customer_id, address, neighborhood").eq("company_id", company.id).order("created_at"),
    supabase.from("assets").select("id, site_id, type, brand, model").eq("company_id", company.id),
    supabase.from("service_types").select("id, name, estimated_minutes, checklist").eq("company_id", company.id).eq("active", true).order("name"),
    supabase
      .from("memberships")
      .select("id, full_name")
      .eq("company_id", company.id)
      .eq("role", "technician")
      .eq("active", true)
      .order("full_name"),
  ]);

  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/ordenes" className="hover:underline">Órdenes</Link> / Nueva
      </nav>
      <PageHeader title="Nueva orden" />
      <NewOrderForm
        today={bogotaDateKey()}
        initialCustomerId={customers.data?.some((c) => c.id === cliente) ? cliente : undefined}
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

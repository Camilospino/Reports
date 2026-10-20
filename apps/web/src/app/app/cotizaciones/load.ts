import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@tecnio/db";

// Clientes y catálogo para el editor de cotizaciones.
export async function loadEditorData(supabase: SupabaseClient<Database>, companyId: string) {
  const [customers, materials] = await Promise.all([
    supabase.from("customers").select("id, name, contact_name, phone_whatsapp").eq("company_id", companyId).order("name"),
    supabase.from("materials").select("id, name, unit, unit_price").eq("company_id", companyId).eq("active", true).order("name"),
  ]);
  return {
    customers: customers.data ?? [],
    materials: (materials.data ?? []).map((m) => ({ ...m, unit_price: Number(m.unit_price) })),
  };
}

export const in15Days = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date(Date.now() + 15 * 86_400_000));

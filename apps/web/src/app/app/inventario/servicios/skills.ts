import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@tecnio/db";

// Especialidades que ya usa la empresa (de técnicos y servicios), para sugerirlas.
export async function companySkills(supabase: SupabaseClient<Database>, companyId: string) {
  const [techs, services] = await Promise.all([
    supabase.from("memberships").select("skills").eq("company_id", companyId).eq("role", "technician"),
    supabase.from("service_types").select("skill").eq("company_id", companyId),
  ]);
  const all = [...(techs.data ?? []).flatMap((t) => t.skills), ...(services.data ?? []).map((s) => s.skill)];
  return [...new Set(all.filter((s): s is string => Boolean(s)))].sort((a, b) => a.localeCompare(b, "es"));
}

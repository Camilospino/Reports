import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Si el usuario pertenece a varias empresas, esta cookie dice cuál está usando.
export const COMPANY_COOKIE = "tecnio_empresa";

// Usuario actual con su membership y empresa activas.
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, role, full_name, company_id, companies(id, name, phone, logo_url, plan, subscription_status, trial_ends_at)")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at");
  if (!memberships?.length) redirect("/onboarding");

  const wanted = (await cookies()).get(COMPANY_COOKIE)?.value;
  const membership = memberships.find((m) => m.company_id === wanted) ?? memberships[0]!;
  const company = membership.companies!;

  return { supabase, user, membership, company, memberships };
});

// Panel web: solo dueño y despachador. Los técnicos usan la app móvil.
export async function requireStaff() {
  const session = await getSession();
  if (session.membership.role === "technician") redirect("/tecnico");
  return session;
}

export async function requireOwner() {
  const session = await getSession();
  if (session.membership.role !== "owner") redirect("/app");
  return session;
}

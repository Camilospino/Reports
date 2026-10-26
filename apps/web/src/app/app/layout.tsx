import { redirect } from "next/navigation";
import { Sidebar } from "@/components/panel/sidebar";
import { Toaster } from "@/components/ui/toast";
import { getSession } from "@/lib/session";
import { shortDate } from "@/lib/format";

const PLAN_NAMES: Record<string, string> = { arranque: "Arranque", equipo: "Equipo", empresa: "Empresa" };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, membership, company } = await getSession();
  if (membership.role === "technician") redirect("/tecnico");

  const { count: technicians } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company.id)
    .eq("role", "technician")
    .eq("active", true);

  const plan = PLAN_NAMES[company.plan] ?? company.plan;
  const n = technicians ?? 0;
  const planDetail =
    company.subscription_status === "trial"
      ? `Prueba gratis hasta el ${shortDate(company.trial_ends_at)}`
      : company.subscription_status === "past_due"
        ? "Pago pendiente"
        : "Suscripción activa";

  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-[10px] bg-surface px-4 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:outline-2 focus:outline-primary"
      >
        Saltar al contenido
      </a>
      <Sidebar
        companyName={company.name}
        userName={membership.full_name}
        planTitle={`Plan ${plan} · ${n} ${n === 1 ? "técnico" : "técnicos"}`}
        planDetail={planDetail}
      />
      <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-8 sm:py-7">{children}</main>
      <Toaster />
    </div>
  );
}

import { UpgradeNotice } from "@/components/panel/upgrade-notice";
import { requireStaff } from "@/lib/session";
import { planOf } from "@/lib/plan";

export default async function QuotesLayout({ children }: { children: React.ReactNode }) {
  const { company } = await requireStaff();
  if (planOf(company.plan).extras) return children;
  return (
    <UpgradeNotice
      title="Cotizaciones"
      description="Arma cotizaciones con tus materiales y servicios, mándalas por WhatsApp y conviértelas en orden cuando el cliente las apruebe."
      company={company.name}
      plan={company.plan}
    />
  );
}

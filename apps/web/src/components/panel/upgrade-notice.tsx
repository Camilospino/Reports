import { Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { upgradeHref } from "@/lib/plan";

// Lo que ve una empresa en Arranque al entrar a una sección que es desde el plan Equipo.
export function UpgradeNotice({
  title,
  description,
  company,
  plan,
}: {
  title: string;
  description: string;
  company: string;
  plan: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      <div className="mx-auto max-w-lg rounded-[14px] border border-line bg-surface px-6 py-10 text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-bg text-muted">
          <Lock size={22} aria-hidden />
        </span>
        <h2 className="font-display text-xl font-bold text-ink">Disponible desde el plan Equipo</h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <a href={upgradeHref(company, plan)} target="_blank" rel="noopener noreferrer" className="btn-accent mt-6 inline-flex">
          Escríbenos para cambiar de plan
        </a>
      </div>
    </>
  );
}

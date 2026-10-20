import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

// Secciones del menú que se construyen en los siguientes pasos.
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} />
      <section className="card max-w-2xl">
        <p className="font-semibold">Esta sección está en construcción.</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
        <Link href="/app" className="btn-outline mt-4">Volver al inicio</Link>
      </section>
    </>
  );
}

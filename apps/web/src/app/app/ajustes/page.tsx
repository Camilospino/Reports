import Link from "next/link";
import { ChevronRight, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaff } from "@/lib/session";

export const metadata = { title: "Ajustes · Tecnio" };

export default async function SettingsPage() {
  const { company, membership } = await requireStaff();
  return (
    <>
      <PageHeader title="Ajustes" description={company.name} />
      <ul className="card max-w-2xl p-0">
        <li>
          <Link href="/app/ajustes/equipo" className="flex min-h-16 items-center gap-4 rounded-[14px] px-5 py-4 hover:bg-bg">
            <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
              <Users size={18} aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Equipo</span>
              <span className="block text-sm text-muted">Invita despachadores y técnicos, y administra sus accesos.</span>
            </span>
            <ChevronRight size={18} className="text-muted" aria-hidden />
          </Link>
        </li>
        {membership.role === "owner" && (
          <li className="border-t border-line-soft">
            <Link href="/app/ajustes/pagos" className="flex min-h-16 items-center gap-4 rounded-[14px] px-5 py-4 hover:bg-bg">
              <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-primary-soft text-primary">
                <Wallet size={18} aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">Datos de pago</span>
                <span className="block text-sm text-muted">Nequi y cuenta bancaria que ve tu cliente al pagar desde el reporte.</span>
              </span>
              <ChevronRight size={18} className="text-muted" aria-hidden />
            </Link>
          </li>
        )}
      </ul>
    </>
  );
}

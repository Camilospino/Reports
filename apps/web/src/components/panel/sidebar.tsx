"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  Package,
  Settings,
  User,
  Wrench,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { signOut } from "@/app/(auth)/actions";

const NAV = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/agenda", label: "Agenda", icon: Calendar },
  { href: "/app/ordenes", label: "Órdenes", icon: ClipboardList },
  { href: "/app/clientes", label: "Clientes", icon: User },
  { href: "/app/tecnicos", label: "Técnicos", icon: Wrench },
  { href: "/app/cotizaciones", label: "Cotizaciones", icon: FileText },
  { href: "/app/inventario", label: "Inventario", icon: Package },
  { href: "/app/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/app/ajustes", label: "Ajustes", icon: Settings },
];

export function Sidebar({
  companyName,
  userName,
  planTitle,
  planDetail,
}: {
  companyName: string;
  userName: string;
  planTitle: string;
  planDetail: string;
}) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  // El menú del celular se cierra solo al cambiar de página.
  const open = openOn === pathname;

  const isActive = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));

  return (
    <aside className="bg-ink text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[232px] lg:shrink-0 lg:flex-col lg:px-4 lg:py-6">
      {/* En celular: barra superior con botón de menú */}
      <div className="flex h-16 items-center justify-between px-4 lg:mb-7 lg:h-auto lg:px-1">
        <Link href="/app" aria-label="Tecnio, ir al inicio">
          <Logo />
        </Link>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-[10px] text-[#C3D1CC] hover:bg-ink-2 lg:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        id="menu-principal"
        className={`${open ? "flex" : "hidden"} flex-col gap-4 px-4 pb-5 lg:flex lg:flex-1 lg:px-0 lg:pb-0`}
      >
        <nav aria-label="Principal" className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-ink-2 text-white" : "text-[#C3D1CC] hover:bg-ink-2/60 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={1.8} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-[12px] bg-ink-2 p-3.5">
            <p className="text-sm font-semibold text-white">{planTitle}</p>
            <p className="mt-0.5 text-[13px] text-[#A9BBB4]">{planDetail}</p>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">{userName}</p>
              <p className="truncate text-xs text-[#A9BBB4]">{companyName}</p>
            </div>
            <form action={signOut}>
              <button
                className="inline-flex size-11 items-center justify-center rounded-[10px] text-[#C3D1CC] hover:bg-ink-2 hover:text-white"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={18} strokeWidth={1.8} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}

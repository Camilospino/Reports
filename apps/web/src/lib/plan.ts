import { PLANES } from "@/components/landing/planes";
import { WHATSAPP_NUMBER } from "@/components/landing/config";

// Qué incluye el plan de la empresa (companies.plan: arranque | equipo | empresa).
// La base de datos hace cumplir lo mismo (migración limites_plan); aquí es para mostrarlo.
export function planOf(plan: string) {
  const p = PLANES.find((x) => x.name.toLowerCase() === plan) ?? PLANES[0]!;
  return {
    name: p.name,
    technicians: p.technicians,
    /** Inventario, cotizaciones, técnico sugerido y reportes del mes: desde Equipo. */
    extras: p.name !== "Arranque",
  };
}

export function upgradeHref(company: string, plan: string) {
  const text = `Hola, soy de ${company} (plan ${planOf(plan).name}) y quiero cambiar de plan en Tecnio.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

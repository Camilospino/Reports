import { AuthCard } from "@/components/ui/auth-card";
import { signOut } from "@/app/(auth)/actions";
import { getSession } from "@/lib/session";

export const metadata = { title: "App del técnico · Tecnio" };

// El panel web es para dueño y despachador; los técnicos trabajan desde la app móvil.
export default async function TechnicianPage() {
  const { company } = await getSession();
  return (
    <AuthCard title="Usa la app del técnico" subtitle={company.name}>
      <p className="text-sm text-muted">
        El panel web es para el dueño y el despachador. Tus órdenes del día están en la app móvil de Tecnio.
      </p>
      <form action={signOut} className="mt-5">
        <button className="btn-outline w-full">Cerrar sesión</button>
      </form>
    </AuthCard>
  );
}

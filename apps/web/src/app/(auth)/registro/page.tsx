import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { readInvite } from "@/lib/invite";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Crear empresa · Tecnio", robots: { index: false } };

// Solo se entra con el enlace de invitación (/registro?invitacion=...). Sin él, no hay formulario.
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ invitacion?: string }> }) {
  const { invitacion } = await searchParams;
  const invite = readInvite(invitacion);

  if (!invite) {
    return (
      <AuthCard title="Tecnio es solo con invitación" subtitle="Este enlace no es válido o ya venció.">
        <p className="text-sm text-muted">
          Para usar Tecnio en tu empresa, agenda una demo y te enviamos un enlace para crear tu cuenta.
        </p>
        <div className="mt-5 space-y-3">
          <Link href="/#demo" className="btn-accent w-full">Agendar demo</Link>
          <p className="text-center text-sm text-muted">
            ¿Ya tienes cuenta? <Link href="/login" className="link">Inicia sesión</Link>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Crea tu empresa" subtitle="14 días de prueba gratis, sin tarjeta.">
      <RegisterForm token={invitacion!} email={invite.email} />
    </AuthCard>
  );
}

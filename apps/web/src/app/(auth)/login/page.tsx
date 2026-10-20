import { AuthCard } from "@/components/ui/auth-card";
import { FormMessage } from "@/components/ui/form-message";
import { LoginForm } from "./login-form";

export const metadata = { title: "Iniciar sesión · Tecnio" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthCard title="Inicia sesión" subtitle="Entra con tu correo y contraseña.">
      {error === "enlace" && (
        <div className="mb-4">
          <FormMessage state={{ error: "El enlace venció o ya se usó. Pide uno nuevo." }} />
        </div>
      )}
      <LoginForm />
    </AuthCard>
  );
}

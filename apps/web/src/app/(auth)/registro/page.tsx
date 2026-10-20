import { AuthCard } from "@/components/ui/auth-card";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Crear empresa · Tecnio" };

export default function RegisterPage() {
  return (
    <AuthCard title="Crea tu empresa" subtitle="14 días de prueba gratis, sin tarjeta.">
      <RegisterForm />
    </AuthCard>
  );
}

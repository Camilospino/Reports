import { redirect } from "next/navigation";
import { AuthCard } from "@/components/ui/auth-card";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Tu empresa · Tecnio" };

// Usuario con sesión pero sin empresa (por ejemplo, confirmó el correo después de registrarse).
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;

  return (
    <AuthCard title="Datos de tu empresa" subtitle="Un paso más y entras al panel.">
      <OnboardingForm
        defaults={{
          full_name: meta.full_name ?? "",
          phone: meta.phone ?? "",
          company_name: meta.company_name ?? "",
          nit: meta.nit ?? "",
        }}
      />
    </AuthCard>
  );
}

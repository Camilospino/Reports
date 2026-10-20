"use client";

import { useActionState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { FormMessage } from "@/components/ui/form-message";
import { setPassword } from "../actions";

// Llega aquí desde el correo de invitación o de recuperación (ya con sesión).
export default function SetPasswordPage() {
  const [state, action, pending] = useActionState(setPassword, null);
  return (
    <AuthCard title="Crea tu contraseña" subtitle="La usarás para entrar a Tecnio.">
      <form action={action} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">Contraseña nueva</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className="input" required autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Repite la contraseña</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} className="input" required />
        </div>
        <FormMessage state={state} />
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </AuthCard>
  );
}

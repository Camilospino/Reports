"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { FormMessage } from "@/components/ui/form-message";
import { requestPasswordReset } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return (
    <AuthCard title="Olvidé mi contraseña" subtitle="Te enviamos un enlace para crear una nueva.">
      <form action={action} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" autoComplete="email" className="input" required autoFocus />
        </div>
        <FormMessage state={state} />
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "Enviando…" : "Enviar enlace"}
        </button>
        <p className="text-center text-sm">
          <Link href="/login" className="link">Volver a iniciar sesión</Link>
        </p>
      </form>
    </AuthCard>
  );
}

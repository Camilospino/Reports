"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { signIn } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required autoFocus />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="label" htmlFor="password">Contraseña</label>
          <Link href="/olvide-contrasena" className="link text-sm">Olvidé mi contraseña</Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </div>
      <FormMessage state={state} />
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm text-muted">
        ¿Tu empresa aún no usa Tecnio? <Link href="/registro" className="link">Créala gratis</Link>
      </p>
    </form>
  );
}

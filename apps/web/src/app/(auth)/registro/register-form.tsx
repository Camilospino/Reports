"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { register } from "../actions";

export function RegisterForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(register, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="invitacion" value={token} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">Tu nombre</label>
          <input id="full_name" name="full_name" autoComplete="name" className="input" required autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="phone">Celular</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="300 111 2233" className="input" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="email">Correo</label>
        {/* El correo viene en la invitación y no se puede cambiar. */}
        <input id="email" type="email" autoComplete="email" className="input" value={email} readOnly aria-readonly />
      </div>
      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className="input" required aria-describedby="password-hint" />
        <p id="password-hint" className="mt-1 text-xs text-muted">Mínimo 8 caracteres.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="company_name">Nombre de la empresa</label>
          <input id="company_name" name="company_name" autoComplete="organization" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="nit">NIT <span className="font-normal text-muted">(opcional)</span></label>
          <input id="nit" name="nit" className="input" />
        </div>
      </div>
      <FormMessage state={state} />
      <button className="btn-accent w-full" disabled={pending}>
        {pending ? "Creando…" : "Crear empresa"}
      </button>
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta? <Link href="/login" className="link">Inicia sesión</Link>
      </p>
    </form>
  );
}

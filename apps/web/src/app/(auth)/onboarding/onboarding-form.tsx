"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { createCompany, signOut } from "../actions";

type Defaults = { full_name: string; phone: string; company_name: string; nit: string };

export function OnboardingForm({ defaults }: { defaults: Defaults }) {
  const [state, action, pending] = useActionState(createCompany, null);
  return (
    <>
      <form action={action} className="space-y-4">
        <div>
          <label className="label" htmlFor="full_name">Tu nombre</label>
          <input id="full_name" name="full_name" defaultValue={defaults.full_name} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Celular</label>
          <input id="phone" name="phone" type="tel" defaultValue={defaults.phone} placeholder="300 111 2233" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="company_name">Nombre de la empresa</label>
          <input id="company_name" name="company_name" defaultValue={defaults.company_name} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="nit">NIT <span className="font-normal text-muted">(opcional)</span></label>
          <input id="nit" name="nit" defaultValue={defaults.nit} className="input" />
        </div>
        <FormMessage state={state} />
        <button className="btn-accent w-full" disabled={pending}>
          {pending ? "Creando…" : "Crear empresa"}
        </button>
      </form>
      <form action={signOut} className="mt-3 text-center">
        <button className="inline-flex h-11 items-center px-3 text-sm text-muted hover:text-ink">Salir</button>
      </form>
    </>
  );
}

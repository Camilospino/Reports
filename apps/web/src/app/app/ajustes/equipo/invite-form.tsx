"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { inviteMember } from "./actions";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="full_name">Nombre</label>
        <input id="full_name" name="full_name" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="phone">Celular <span className="font-normal text-muted">(opcional)</span></label>
        <input id="phone" name="phone" type="tel" placeholder="300 111 2233" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="role">Rol</label>
        <select id="role" name="role" className="input" defaultValue="technician">
          <option value="technician">Técnico</option>
          <option value="dispatcher">Despachador</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="skills">
          Especialidades <span className="font-normal text-muted">(técnicos, separadas por coma)</span>
        </label>
        <input id="skills" name="skills" placeholder="CCTV, Redes, Aires" className="input" />
      </div>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <div className="sm:col-span-2">
        <button className="btn-accent" disabled={pending}>{pending ? "Enviando…" : "Enviar invitación"}</button>
      </div>
    </form>
  );
}

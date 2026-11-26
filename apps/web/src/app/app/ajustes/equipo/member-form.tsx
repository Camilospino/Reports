"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { addMember } from "./actions";
import { CredentialsBox, randomPassword, type AccessLinks } from "./credentials";

export function MemberForm({ links }: { links: AccessLinks }) {
  const [state, action, pending] = useActionState(addMember, null);
  // Se genera en el navegador (no en el render del servidor) para que no cambie al hidratar.
  const [password, setPassword] = useState("");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => setPassword(randomPassword()), []);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setPassword(randomPassword());
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <form ref={ref} action={action} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">
            Nombre
          </label>
          <input id="full_name" name="full_name" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Correo
          </label>
          <input id="email" name="email" type="email" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Celular <span className="font-normal text-muted">(para mandarle el acceso por WhatsApp)</span>
          </label>
          <input id="phone" name="phone" type="tel" placeholder="300 111 2233" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="role">
            Rol
          </label>
          <select id="role" name="role" className="input" defaultValue="technician">
            <option value="technician">Técnico</option>
            <option value="dispatcher">Despachador</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña temporal <span className="font-normal text-muted">(la cambia al entrar)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="password"
              name="password"
              className="input font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              autoComplete="off"
              spellCheck={false}
              required
            />
            <button type="button" className="btn-outline shrink-0" onClick={() => setPassword(randomPassword())}>
              Otra
            </button>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="skills">
            Especialidades <span className="font-normal text-muted">(técnicos, separadas por coma)</span>
          </label>
          <input id="skills" name="skills" placeholder="CCTV, Redes, Aires" className="input" />
        </div>
        <div className="sm:col-span-2">
          <FormMessage state={state} />
        </div>
        <div className="sm:col-span-2">
          <button className="btn-accent" disabled={pending}>
            {pending ? "Creando…" : "Crear cuenta"}
          </button>
        </div>
      </form>
      {state?.ok && state.credentials && <CredentialsBox credentials={state.credentials} links={links} />}
    </div>
  );
}

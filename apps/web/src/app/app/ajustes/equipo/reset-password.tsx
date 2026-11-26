"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { resetMemberPassword } from "./actions";
import { CredentialsBox, randomPassword, type AccessLinks } from "./credentials";

// Botón "Cambiar contraseña" de cada persona del equipo: abre un cuadro con una clave nueva ya sugerida.
type Props = { id: string; name: string; links: AccessLinks };

export function ResetPassword(props: Props) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button
        type="button"
        className="btn-outline"
        aria-label={`Cambiar la contraseña de ${props.name}`}
        onClick={() => setOpen(true)}
      >
        Cambiar contraseña
      </button>
    );
  // Se monta de nuevo cada vez que se abre: no queda la clave ni el mensaje de la vez anterior.
  return <ResetPanel {...props} onClose={() => setOpen(false)} />;
}

function ResetPanel({ id, name, links, onClose }: Props & { onClose: () => void }) {
  const [password, setPassword] = useState(randomPassword);
  const [state, action, pending] = useActionState(resetMemberPassword, null);

  return (
    <div className="flex min-w-[280px] flex-col gap-3">
      {state?.ok && state.credentials ? (
        <CredentialsBox credentials={state.credentials} links={links} />
      ) : (
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={id} />
          <label className="label" htmlFor={`pw-${id}`}>
            Contraseña nueva para {name}
          </label>
          <div className="flex gap-2">
            <input
              id={`pw-${id}`}
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
          <FormMessage state={state} />
          <div className="flex gap-2">
            <button className="btn-accent" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      )}
      {state?.ok && (
        <button type="button" className="btn-outline self-start" onClick={onClose}>
          Listo
        </button>
      )}
    </div>
  );
}

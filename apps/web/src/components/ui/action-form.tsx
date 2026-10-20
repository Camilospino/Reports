"use client";

import { useActionState, useEffect, useRef } from "react";
import { FormMessage } from "@/components/ui/form-message";
import type { FormState } from "@/lib/format";

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

// Formulario con una server action: muestra el error o el aviso de éxito y deshabilita
// el botón mientras guarda. Con resetOnSuccess se limpia después de guardar (para "agregar").
export function ActionForm({
  action,
  children,
  submit,
  pendingLabel = "Guardando…",
  className = "grid gap-4",
  buttonClassName = "btn-accent",
  resetOnSuccess = false,
  confirm,
}: {
  action: Action;
  children?: React.ReactNode;
  submit: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  buttonClassName?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <FormMessage state={state} />
      <div>
        <button className={buttonClassName} disabled={pending}>
          {pending ? pendingLabel : submit}
        </button>
      </div>
    </form>
  );
}

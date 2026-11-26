"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { saveMaintenanceSettings } from "./actions";

export function MaintenanceForm({ days }: { days: number | null }) {
  const [state, action, pending] = useActionState(saveMaintenanceSettings, null);
  const [enabled, setEnabled] = useState(days !== null);
  return (
    <form action={action} className="grid gap-4">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-1 size-4 accent-[var(--color-primary)]"
        />
        <span>
          <span className="block font-semibold">Crear las órdenes de mantenimiento automáticamente</span>
          <span className="block text-sm text-muted">
            Cada mañana revisamos las instalaciones con plan de mantenimiento y creamos una orden pendiente para las que estén por
            vencer. Tú solo le asignas técnico y horario en la agenda.
          </span>
        </span>
      </label>
      <div>
        <label className="label" htmlFor="days">
          Días de anticipación
        </label>
        <input
          id="days"
          name="days"
          type="number"
          inputMode="numeric"
          min={1}
          max={60}
          defaultValue={days ?? 15}
          disabled={!enabled}
          className="input max-w-32"
        />
      </div>
      {!enabled && <input type="hidden" name="days" value={days ?? 15} />}
      <FormMessage state={state} />
      <div>
        <button className="btn-accent" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</button>
      </div>
    </form>
  );
}

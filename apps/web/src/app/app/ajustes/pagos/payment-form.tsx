"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { savePayment } from "./actions";

export type PaymentValues = {
  payment_nequi: string | null;
  payment_bank: string | null;
  payment_account_type: string | null;
  payment_account_number: string | null;
  payment_account_holder: string | null;
  payment_holder_id: string | null;
  payment_notes: string | null;
};

export function PaymentForm({ values }: { values: PaymentValues }) {
  const [state, action, pending] = useActionState(savePayment, null);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="payment_nequi">
          Nequi <span className="font-normal text-muted">(celular)</span>
        </label>
        <input id="payment_nequi" name="payment_nequi" type="tel" inputMode="numeric" placeholder="310 123 4567" defaultValue={values.payment_nequi ?? ""} className="input sm:max-w-xs" />
      </div>

      <fieldset className="contents">
        <legend className="font-display font-bold sm:col-span-2">Transferencia bancaria</legend>
        <div>
          <label className="label" htmlFor="payment_bank">Banco</label>
          <input id="payment_bank" name="payment_bank" placeholder="Bancolombia" defaultValue={values.payment_bank ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="payment_account_type">Tipo de cuenta</label>
          <select id="payment_account_type" name="payment_account_type" defaultValue={values.payment_account_type ?? ""} className="input">
            <option value="">Selecciona</option>
            <option value="ahorros">Ahorros</option>
            <option value="corriente">Corriente</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="payment_account_number">Número de cuenta</label>
          <input id="payment_account_number" name="payment_account_number" inputMode="numeric" placeholder="123-456789-01" defaultValue={values.payment_account_number ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="payment_account_holder">Titular</label>
          <input id="payment_account_holder" name="payment_account_holder" placeholder="Tu empresa S.A.S." defaultValue={values.payment_account_holder ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="payment_holder_id">
            NIT o cédula del titular <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input id="payment_holder_id" name="payment_holder_id" placeholder="NIT 901.234.567-1" defaultValue={values.payment_holder_id ?? ""} className="input" />
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="payment_notes">
          Indicaciones <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea id="payment_notes" name="payment_notes" rows={2} maxLength={300} placeholder="Envía el comprobante por WhatsApp con el número de la orden." defaultValue={values.payment_notes ?? ""} className="textarea" />
      </div>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <div className="sm:col-span-2">
        <button className="btn-accent" disabled={pending}>{pending ? "Guardando…" : "Guardar datos de pago"}</button>
      </div>
    </form>
  );
}

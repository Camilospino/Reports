"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { revealPassword } from "./actions";

export type Credential = { id: string; label: string; host: string | null; username: string | null };

export function CredentialsList({ credentials }: { credentials: Credential[] }) {
  if (!credentials.length) return <p className="text-sm text-muted">Aún no hay accesos guardados.</p>;
  return (
    <div className="space-y-5">
      {credentials.map((c) => (
        <CredentialRows key={c.id} credential={c} />
      ))}
      <p className="text-xs text-muted">Cada vez que alguien la ve, queda registrado.</p>
    </div>
  );
}

function CredentialRows({ credential: c }: { credential: Credential }) {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Cada "Mostrar" vuelve a pedirla a la base, así cada vista queda en el registro.
  const toggle = () => {
    if (password !== null) return setPassword(null);
    setError(null);
    start(async () => {
      const res = await revealPassword(c.id);
      if (res.error) setError(res.error);
      else setPassword(res.password ?? "");
    });
  };

  return (
    <div>
      <dl className="divide-y divide-line-soft text-sm">
        <Row label={`${c.label} · IP local`}>
          <span className="font-mono">{c.host ?? "—"}</span>
        </Row>
        <Row label="Usuario">
          <span className="font-mono">{c.username ?? "—"}</span>
        </Row>
        <Row label="Contraseña">
          <span className="flex items-center gap-2">
            <span className="font-mono" aria-live="polite">
              {password === null ? <span aria-label="Oculta">••••••••••</span> : password || "(vacía)"}
            </span>
            <button
              type="button"
              onClick={toggle}
              disabled={pending}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[8px] px-2 text-[13px] font-semibold text-primary hover:bg-primary-soft disabled:opacity-60"
            >
              {password === null ? <Eye size={15} aria-hidden /> : <EyeOff size={15} aria-hidden />}
              {pending ? "Cargando…" : password === null ? "Mostrar" : "Ocultar"}
              <span className="sr-only"> contraseña de {c.label}</span>
            </button>
          </span>
        </Row>
      </dl>
      {error && (
        <p role="alert" className="pt-2 text-[13px] text-[#9B1C1C]">
          {error}
        </p>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 first:pt-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 text-right [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

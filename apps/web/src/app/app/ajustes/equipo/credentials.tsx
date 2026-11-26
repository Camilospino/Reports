"use client";

import { useState } from "react";
import { whatsappLink } from "@/lib/format";
import type { Credentials } from "./actions";

// Contraseña temporal fácil de dictar y de escribir en el celular: sin letras que se confunden (l/1, O/0).
export function randomPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const pick = (set: string, n: number) =>
    Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => set[x % set.length]).join("");
  return `Tecnio-${pick(letters, 4)}-${pick(digits, 4)}`;
}

export type AccessLinks = {
  company: string;
  loginUrl: string;
  appUrl: string | null;
};

export function credentialsMessage(c: Credentials, links: AccessLinks): string {
  const where =
    c.role === "technician"
      ? links.appUrl
        ? `Descarga la app del técnico aquí: ${links.appUrl}`
        : "Entra desde la app del técnico de Tecnio."
      : `Entra al panel aquí: ${links.loginUrl}`;
  const lines = [
    `Hola ${c.name.split(" ")[0]}, ya tienes acceso a Tecnio de ${links.company.replace(/\.$/, "")}.`,
    "",
    where,
    `Correo: ${c.email}`,
  ];
  if (c.password) {
    lines.push(
      `Contraseña temporal: ${c.password}`,
      "",
      "Al entrar la primera vez te pedirá crear tu propia contraseña.",
    );
  } else {
    lines.push("Usa la contraseña que ya tienes en Tecnio.");
  }
  return lines.join("\n");
}

// Cuadro que aparece después de crear la cuenta o cambiar la contraseña, para pasarle el acceso a la persona.
export function CredentialsBox({ credentials: c, links }: { credentials: Credentials; links: AccessLinks }) {
  const [copied, setCopied] = useState(false);
  const message = credentialsMessage(c, links);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="rounded-[10px] border border-line bg-bg p-4 text-sm">
      <p className="font-semibold">Datos de acceso de {c.name}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-muted">Correo</dt>
        <dd className="font-mono break-all">{c.email}</dd>
        {c.password && (
          <>
            <dt className="text-muted">Contraseña</dt>
            <dd className="font-mono">{c.password}</dd>
          </>
        )}
      </dl>
      {c.password && (
        <p className="mt-2 text-muted">Es temporal: al entrar la primera vez le pedirá crear su propia contraseña.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {c.phone && (
          <a href={whatsappLink(c.phone, message)} target="_blank" rel="noopener noreferrer" className="btn-accent">
            Enviar por WhatsApp
          </a>
        )}
        <button type="button" onClick={copy} className="btn-outline">
          {copied ? "Copiado ✓" : "Copiar mensaje"}
        </button>
      </div>
    </div>
  );
}

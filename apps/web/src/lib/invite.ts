import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Invitaciones para crear una empresa. El registro está cerrado: solo entra quien tenga un enlace
// /registro?invitacion=<token> generado con `npm run invitacion -w web -- correo@empresa.com`.
// El token lleva el correo y la fecha de vencimiento, firmados con INVITE_SECRET (HMAC-SHA256):
// no se puede cambiar el correo ni alargar el plazo sin la clave. Se usa una sola vez porque
// al registrarse ese correo ya queda con cuenta.

export type Invite = { email: string; expiresAt: Date };

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function readInvite(token: string | null | undefined): Invite | null {
  const secret = process.env.INVITE_SECRET;
  if (!secret || !token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const { e, x } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { e?: unknown; x?: unknown };
    if (typeof e !== "string" || typeof x !== "number" || x * 1000 < Date.now()) return null;
    return { email: e, expiresAt: new Date(x * 1000) };
  } catch {
    return null;
  }
}

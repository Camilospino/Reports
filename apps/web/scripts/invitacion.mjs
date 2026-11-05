// Genera el enlace para que una empresa nueva se registre en Tecnio.
// Uso (desde la raíz): npm run invitacion -w web -- correo@empresa.com [días]
// Lee INVITE_SECRET y NEXT_PUBLIC_SITE_URL de apps/web/.env.local. Para enlaces de producción,
// INVITE_SECRET tiene que ser el mismo que está en Netlify.
import { createHmac } from "node:crypto";

const [email, days = "7"] = process.argv.slice(2);
const secret = process.env.INVITE_SECRET;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:4000").replace(/\/$/, "");

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Uso: npm run invitacion -w web -- correo@empresa.com [días]");
  process.exit(1);
}
if (!secret) {
  console.error("Falta INVITE_SECRET en apps/web/.env.local");
  process.exit(1);
}

const expires = Math.floor(Date.now() / 1000) + Number(days) * 86_400;
const payload = Buffer.from(JSON.stringify({ e: email.trim().toLowerCase(), x: expires })).toString("base64url");
const signature = createHmac("sha256", secret).update(payload).digest("base64url");

console.log(`\nInvitación para ${email} (vence en ${days} días):\n\n${site}/registro?invitacion=${payload}.${signature}\n`);

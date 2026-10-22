import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { CONSENT_TEXT, PROPERTY_COUNTS, PROPERTY_TYPES, validateLead, type LeadInput } from "@/components/landing/lead";
import { createAdminClient } from "@/lib/supabase/admin";

// Máximo de solicitudes por IP en la ventana de tiempo (frena envíos repetidos o bots simples).
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 10 * 60_000;

const str = (v: unknown) => (typeof v === "string" ? v : "");

// La IP no se guarda: solo una huella (HMAC con la llave del servidor) para contar envíos.
function ipHash(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconocida";
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY ?? "tecnio").update(ip).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  // Campo trampa: las personas no lo ven; si viene lleno es un bot. Se responde "ok" sin guardar.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const input: LeadInput = {
    name: str(body.name),
    contact: str(body.contact),
    propertyType: str(body.propertyType),
    properties: str(body.properties),
    consent: body.consent === true,
  };
  const errors = validateLead(input);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 422 });

  const supabase = createAdminClient();
  const hash = ipHash(req);

  const { count, error: countError } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gte("created_at", new Date(Date.now() - WINDOW_MS).toISOString());
  if (countError) return NextResponse.json({ error: "No pudimos recibir tus datos." }, { status: 500 });
  if ((count ?? 0) >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: "Ya recibimos tus datos. Si quieres, escríbenos por WhatsApp." }, { status: 429 });
  }

  const lead = {
    name: input.name.trim(),
    contact: input.contact.trim(),
    property_type: input.propertyType,
    properties: input.properties,
    consent: true,
    consent_text: CONSENT_TEXT,
    ip_hash: hash,
    user_agent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
  };
  const { error } = await supabase.from("leads").insert(lead);
  if (error) return NextResponse.json({ error: "No pudimos recibir tus datos." }, { status: 500 });

  await notify(lead).catch((e) => console.error("Aviso de lead no enviado:", e));
  return NextResponse.json({ ok: true });
}

// Aviso por correo con cada interesado nuevo (Resend). Sin RESEND_API_KEY o LEAD_NOTIFY_EMAIL no se envía:
// el interesado queda igual guardado en la tabla leads.
async function notify(lead: { name: string; contact: string; property_type: string; properties: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!key || !to) return;

  const type = PROPERTY_TYPES.find((t) => t.value === lead.property_type)?.label ?? lead.property_type;
  const count = PROPERTY_COUNTS.find((c) => c.value === lead.properties)?.label ?? lead.properties;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.LEAD_FROM_EMAIL ?? "Reportes <onboarding@resend.dev>",
      to,
      subject: `Nueva solicitud de demo: ${lead.name}`,
      text: `Nombre: ${lead.name}\nContacto: ${lead.contact}\nTipo de propiedad: ${type}\nPropiedades: ${count}`,
    }),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}`);
}

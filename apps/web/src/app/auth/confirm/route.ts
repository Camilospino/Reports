import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Enlaces de los correos (invitación, recuperar contraseña, confirmar correo).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/app";
  // Solo rutas internas, para que el enlace no sirva para redirigir a otro sitio. Se resuelve con el
  // mismo parser que hace la redirección y se compara el origen: un startsWith("/") se saltaba con
  // "/\evil.com" o "/\t/evil.com" (URL trata "\" como "/" y borra tabs y saltos de línea).
  // Se redirige con el objeto ya validado, sin volver a parsear texto: "/.//evil.com" deja la ruta
  // en "//evil.com", que reparseada sería otro dominio.
  const base = new URL(request.url);
  let next = new URL("/app", base);
  try {
    const u = new URL(nextParam, base);
    if (!/[\\\x00-\x1f]/.test(nextParam) && u.origin === base.origin && !u.pathname.startsWith("//")) next = u;
  } catch {}

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(next);
  }
  const url = new URL("/login", request.url);
  url.searchParams.set("error", "enlace");
  return NextResponse.redirect(url);
}

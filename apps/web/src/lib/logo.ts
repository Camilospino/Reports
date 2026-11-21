// El logo de la empresa solo puede venir del Storage público de nuestro propio Supabase.
// El PDF (@react-pdf) descarga la imagen EN EL SERVIDOR desde rutas públicas (/r/[token]/pdf,
// /c/[token]/pdf): sin este filtro, un dueño podría poner una URL interna (169.254.169.254, 127.0.0.1…)
// y hacer que el servidor la pida (SSRF). Se compara contra el origen exacto de NEXT_PUBLIC_SUPABASE_URL,
// no un startsWith del texto, para que no cuelen "https://x.supabase.co.evil.com" ni "https://x.supabase.co@evil".
const PUBLIC_STORAGE_PATH = "/storage/v1/object/public/";

export function safeLogoUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  let url: URL;
  let allowed: URL;
  try {
    url = new URL(raw);
    allowed = new URL(base);
  } catch {
    return null;
  }
  if (url.origin !== allowed.origin) return null;
  if (url.username || url.password) return null;
  if (!url.pathname.startsWith(PUBLIC_STORAGE_PATH)) return null;
  // new URL ya normaliza "..", pero se rechaza también la forma codificada.
  if (/%2e%2e|%2f|%5c/i.test(url.pathname)) return null;
  return url.toString();
}

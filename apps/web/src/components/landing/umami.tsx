import Script from "next/script";

// Analítica con Umami Cloud (plan Hobby gratis): sin cookies, así que no hace falta aviso de cookies.
// Solo se carga si NEXT_PUBLIC_UMAMI_WEBSITE_ID está definido (en local no mide nada).
export function Umami() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!websiteId) return null;
  return <Script src="https://cloud.umami.is/script.js" data-website-id={websiteId} strategy="afterInteractive" />;
}

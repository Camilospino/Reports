import Script from "next/script";

// Analítica con Plausible: sin cookies, así que no hace falta aviso de cookies.
// Solo se carga si NEXT_PUBLIC_PLAUSIBLE_DOMAIN está definido (en local no mide nada).
export function Plausible() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  return (
    <>
      {/* Cola: los eventos que ocurran antes de que cargue el script se envían cuando cargue. */}
      <Script id="plausible-cola" strategy="afterInteractive">
        {"window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}"}
      </Script>
      <Script src="https://plausible.io/js/script.js" data-domain={domain} strategy="afterInteractive" />
    </>
  );
}

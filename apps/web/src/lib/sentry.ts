import type { ErrorEvent } from "@sentry/nextjs";

// Configuración común de Sentry (navegador, servidor y edge). Sin DSN no se envía nada:
// en local y en pruebas Sentry queda apagado.
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Los enlaces /r/<token> y /c/<token> abren el reporte o la cotización de un cliente:
// el token es una contraseña y no debe quedar guardado en Sentry.
const TOKEN_IN_PATH = /\/(r|c)\/[0-9a-f]{32}/gi;
export const scrubUrl = (url: string) => url.replace(TOKEN_IN_PATH, "/$1/[token]");

function scrub(event: ErrorEvent): ErrorEvent {
  if (event.request?.url) event.request.url = scrubUrl(event.request.url);
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.query_string && typeof event.request.query_string === "string")
      event.request.query_string = scrubUrl(event.request.query_string);
    if (event.request.headers) {
      // Fuera cookies y sesión; referer y otros encabezados pueden traer la URL del reporte con su token.
      event.request.headers = Object.fromEntries(
        Object.entries(event.request.headers)
          .filter(([k]) => !["cookie", "authorization"].includes(k.toLowerCase()))
          .map(([k, v]) => [k, scrubUrl(String(v))]),
      );
    }
  }
  if (event.transaction) event.transaction = scrubUrl(event.transaction);
  event.breadcrumbs = event.breadcrumbs?.map((b) => ({
    ...b,
    message: b.message ? scrubUrl(b.message) : b.message,
    data: b.data
      ? Object.fromEntries(Object.entries(b.data).map(([k, v]) => [k, typeof v === "string" ? scrubUrl(v) : v]))
      : b.data,
  }));
  return event;
}

export const sentryOptions = {
  dsn: SENTRY_DSN,
  enabled: Boolean(SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  // Solo errores, sin trazas de rendimiento: el plan gratis tiene cuota limitada y las
  // trazas incluyen rutas con el token del cliente (/r/<token>).
  // Sin IP, cookies ni cuerpos de formularios (hay cédulas, teléfonos y direcciones).
  sendDefaultPii: false,
  beforeSend: (event: ErrorEvent) => scrub(event),
};

import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry";

// Errores del servidor: páginas, acciones de servidor, rutas (PDF, fotos) y middleware.
export function register() {
  Sentry.init(sentryOptions);
}

export const onRequestError = Sentry.captureRequestError;

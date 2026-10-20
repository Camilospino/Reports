import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry";

// Errores del navegador (panel, reporte y cotización públicos).
Sentry.init(sentryOptions);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

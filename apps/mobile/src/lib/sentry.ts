import * as Sentry from "@sentry/react-native";

// Errores de la app del técnico. Sin EXPO_PUBLIC_SENTRY_DSN no se envía nada.
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const TOKEN_IN_PATH = /\/(r|c)\/[0-9a-f]{32}/gi;
const scrub = (s: string) => s.replace(TOKEN_IN_PATH, "/$1/[token]");

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? (__DEV__ ? "development" : "production"),
  // Solo errores, sin trazas de rendimiento (cuota del plan gratis).
  // Sin IP ni datos personales: las órdenes tienen cédulas, teléfonos y direcciones.
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.message) event.message = scrub(event.message);
    event.breadcrumbs = event.breadcrumbs?.map((b) => ({ ...b, message: b.message ? scrub(b.message) : b.message }));
    return event;
  },
});

export { Sentry };

// Solo el id del usuario (no correo ni nombre), para agrupar errores por técnico.
export const identify = (userId: string | null) => Sentry.setUser(userId ? { id: userId } : null);

// El servidor rechazó un cambio de la cola: el técnico lo ve en Perfil, y la oficina aquí.
export function reportRejected(type: string, message: string) {
  Sentry.captureMessage(`Cambio rechazado por el servidor (${type})`, { level: "warning", extra: { error: scrub(message) } });
}

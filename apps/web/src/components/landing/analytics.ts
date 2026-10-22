// Eventos de analítica (Umami). Si el script no está cargado, no hace nada.
export type LandingEvent = "clic agendar demo" | "clic probar gratis" | "envío formulario" | "clic WhatsApp";

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string>) => void };
  }
}

// Cada evento lleva la página ("/" o "/para/<sector>") para comparar qué sector responde más.
export function track(event: LandingEvent, props?: Record<string, string>) {
  window.umami?.track(event, { pagina: window.location.pathname, ...props });
}

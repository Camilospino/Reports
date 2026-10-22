// Eventos de analítica (Plausible). Si el script no está cargado, no hace nada.
export type LandingEvent = "clic agendar demo" | "envío formulario" | "clic WhatsApp";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

export function track(event: LandingEvent, props?: Record<string, string>) {
  window.plausible?.(event, props ? { props } : undefined);
}

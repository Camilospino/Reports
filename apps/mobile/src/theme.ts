// Sistema de diseño de Tecnio (el mismo del panel web).
export const colors = {
  bg: "#F3F5F4",
  surface: "#FFFFFF",
  ink: "#10211C",
  ink2: "#1B3029",
  muted: "#55645F",
  line: "#DDE3E0",
  lineSoft: "#EEF2F0",
  primary: "#0E5A4A",
  primarySoft: "#E3EFEB",
  accent: "#C2400D",
  accentSoft: "#FDEBDF",
  headerMuted: "#A9BBB4",
  online: "#4CC59A",
  danger: "#9B1C1C",
  dangerSoft: "#F6E3E3",
};

export const fonts = {
  display: "SpaceGrotesk_700Bold",
  displayMedium: "SpaceGrotesk_500Medium",
  body: "IBMPlexSans_400Regular",
  bodyMedium: "IBMPlexSans_500Medium",
  bodySemibold: "IBMPlexSans_600SemiBold",
  bodyBold: "IBMPlexSans_700Bold",
};

export type OrderStatus = "pendiente" | "asignada" | "en_camino" | "en_proceso" | "completada" | "cancelada";

// Chips de estado: siempre con texto, nunca solo color.
export const STATUS: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
  pendiente: { label: "Pendiente", bg: "#ECEFEE", fg: "#46534F" },
  asignada: { label: "Asignada", bg: "#E4ECFA", fg: "#1F4FA8" },
  en_camino: { label: "En camino", bg: "#FDEBDF", fg: "#A33A0B" },
  en_proceso: { label: "En proceso", bg: "#E3EFEB", fg: "#0E5A4A" },
  completada: { label: "Completada", bg: "#10211C", fg: "#FFFFFF" },
  cancelada: { label: "Cancelada", bg: "#F6E3E3", fg: "#9B1C1C" },
};

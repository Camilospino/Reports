import { Alert, Linking } from "react-native";
import type { LocalOrder } from "./db";
import { dateKey, directionsLink, wazeLink } from "./format";

const CLOSED = ["completada", "cancelada"];

export const isToday = (o: LocalOrder, today = dateKey()) => !!o.scheduled_start && dateKey(o.scheduled_start) === today;

// Orden actual: la que está en proceso, si no la que va en camino.
export function currentOrder(orders: LocalOrder[]) {
  return orders.find((o) => o.status === "en_proceso") ?? orders.find((o) => o.status === "en_camino") ?? null;
}

export function upcoming(orders: LocalOrder[], exclude?: string) {
  return orders.filter((o) => o.id !== exclude && !CLOSED.includes(o.status) && o.status !== "en_proceso" && o.status !== "en_camino");
}

export function durationMs(o: LocalOrder) {
  return o.scheduled_start && o.scheduled_end ? Date.parse(o.scheduled_end) - Date.parse(o.scheduled_start) : 60 * 60_000;
}

// Tiempo trabajado hoy: de "Llegué" a terminar (o hasta ahora si sigue en proceso).
export function workedMs(orders: LocalOrder[], now = Date.now()) {
  return orders.reduce((sum, o) => {
    if (!o.started_at) return sum;
    const end = o.completed_at ? Date.parse(o.completed_at) : o.status === "en_proceso" ? now : null;
    return end ? sum + Math.max(0, end - Date.parse(o.started_at)) : sum;
  }, 0);
}

export function call(phone: string | null | undefined) {
  if (!phone) return Alert.alert("Sin teléfono", "Este cliente no tiene teléfono registrado.");
  void Linking.openURL(`tel:+${phone.replace(/\D/g, "")}`);
}

// "Cómo llegar": Google Maps o Waze con las coordenadas (sin APIs de mapas).
export function directions(o: LocalOrder) {
  const lat = o.site?.lat;
  const lng = o.site?.lng;
  if (lat == null || lng == null) {
    const q = encodeURIComponent([o.site?.address, o.site?.city].filter(Boolean).join(", "));
    if (!q) return Alert.alert("Sin dirección", "Esta orden no tiene dirección.");
    return void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  }
  Alert.alert("Cómo llegar", "¿Con qué app?", [
    { text: "Google Maps", onPress: () => void Linking.openURL(directionsLink(lat, lng)) },
    { text: "Waze", onPress: () => void Linking.openURL(wazeLink(lat, lng)) },
    { text: "Cancelar", style: "cancel" },
  ]);
}

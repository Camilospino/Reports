import { Alert, Linking } from "react-native";
import type { LocalOrder } from "./db";
import { reportMessage, whatsappLink } from "./format";
import { SITE_URL } from "./supabase";

// Abre WhatsApp con el mensaje del reporte. El enlace existe cuando el cierre ya subió.
export function sendReport(o: LocalOrder): boolean {
  if (!o.customer.phone_whatsapp) {
    Alert.alert("Sin WhatsApp", "El cliente no tiene WhatsApp registrado. El despachador puede enviarle el reporte.");
    return false;
  }
  if (!o.public_token) {
    Alert.alert("Falta subir el cierre", "El reporte se podrá enviar cuando el celular suba el cierre de la orden.");
    return false;
  }
  const url = `${SITE_URL}/r/${o.public_token}`;
  void Linking.openURL(whatsappLink(o.customer.phone_whatsapp, reportMessage(o.customer.contact_name ?? o.customer.name, url)));
  return true;
}

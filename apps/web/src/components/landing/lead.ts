// Formulario de demo: opciones y validación. La usan el navegador (errores al instante) y
// /api/lead (que nunca confía en lo que llega).

export const COMPANY_TYPES = [
  { value: "aire", label: "Aire acondicionado y refrigeración" },
  { value: "seguridad", label: "Seguridad electrónica" },
  { value: "internet", label: "Internet y telecomunicaciones" },
  { value: "electricidad", label: "Electricidad y plomería" },
  { value: "mantenimiento", label: "Mantenimiento de equipos" },
  { value: "otra", label: "Otra" },
] as const;

export const TECHNICIAN_COUNTS = [
  { value: "1-3", label: "1 a 3" },
  { value: "4-10", label: "4 a 10" },
  { value: "11-30", label: "11 a 30" },
  { value: "30+", label: "Más de 30" },
] as const;

export const CONSENT_TEXT =
  "Autorizo el tratamiento de mis datos personales según la Política de privacidad (Ley 1581 de 2012).";

export type LeadInput = {
  name: string;
  contact: string;
  companyType: string;
  technicians: string;
  consent: boolean;
};
export type LeadField = keyof LeadInput;
export type LeadErrors = Partial<Record<LeadField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Página desde la que llegó la solicitud: "/" o "/para/<sector>".
export const SOURCE = /^\/[a-z0-9/-]{0,60}$/;

// Correo, o un número de WhatsApp de 7 a 15 dígitos (se permiten espacios, guiones y +57).
export function isContact(value: string) {
  const v = value.trim();
  if (EMAIL.test(v)) return true;
  const digits = v.replace(/[\s()+-]/g, "");
  return /^\d{7,15}$/.test(digits);
}

export function validateLead(input: LeadInput): LeadErrors {
  const errors: LeadErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = "Escribe tu nombre.";
  else if (name.length > 120) errors.name = "El nombre es muy largo.";

  if (!input.contact.trim()) errors.contact = "Escribe tu correo o tu WhatsApp.";
  else if (input.contact.trim().length > 160 || !isContact(input.contact))
    errors.contact = "Revisa el dato: debe ser un correo o un número de WhatsApp.";

  if (!COMPANY_TYPES.some((t) => t.value === input.companyType)) errors.companyType = "Elige el tipo de empresa.";
  if (!TECHNICIAN_COUNTS.some((c) => c.value === input.technicians)) errors.technicians = "Elige cuántos técnicos tienes.";
  if (input.consent !== true) errors.consent = "Necesitamos tu autorización para escribirte.";
  return errors;
}

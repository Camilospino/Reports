// Formulario de demo: opciones y validación. La usan el navegador (errores al instante) y
// /api/lead (que nunca confía en lo que llega).

export const PROPERTY_TYPES = [
  { value: "conjunto", label: "Conjunto residencial" },
  { value: "oficinas", label: "Edificio de oficinas" },
  { value: "hotel", label: "Hotel" },
  { value: "colegio", label: "Colegio" },
  { value: "bodega", label: "Bodega o local" },
  { value: "otra", label: "Otra" },
] as const;

export const PROPERTY_COUNTS = [
  { value: "1", label: "1" },
  { value: "2-5", label: "2 a 5" },
  { value: "6+", label: "Más de 5" },
] as const;

export const CONSENT_TEXT =
  "Autorizo el tratamiento de mis datos personales según la Política de privacidad (Ley 1581 de 2012).";

export type LeadInput = {
  name: string;
  contact: string;
  propertyType: string;
  properties: string;
  consent: boolean;
};
export type LeadField = keyof LeadInput;
export type LeadErrors = Partial<Record<LeadField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

  if (!PROPERTY_TYPES.some((t) => t.value === input.propertyType)) errors.propertyType = "Elige el tipo de propiedad.";
  if (!PROPERTY_COUNTS.some((c) => c.value === input.properties)) errors.properties = "Elige cuántas propiedades tienes.";
  if (input.consent !== true) errors.consent = "Necesitamos tu autorización para escribirte.";
  return errors;
}

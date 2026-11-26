// Datos de contacto y marca de la página pública. Lo que va entre corchetes falta por llenar.
export const BRAND = "Tecnio";
export const BRAND_TAG = "para empresas de servicio técnico";

export const WHATSAPP_NUMBER = "573002823551"; // Con indicativo (57) y sin signos.
export const WHATSAPP_MESSAGE = "Hola, quiero contratar Tecnio";
export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export const CONTACT_EMAIL = "heynohay@gmail.com";

// Enlaces del menú. Llevan "/" delante para que también funcionen desde /terminos y /privacidad.
export const NAV_LINKS = [
  { href: "/#recorrido", label: "Cómo funciona" },
  { href: "/#para-quien", label: "Para quién" },
  { href: "/#precios", label: "Precios" },
] as const;

// El registro es solo con invitación (ver lib/invite.ts) y no hay prueba gratis: "Contratar" lleva
// al formulario de contacto y el enlace para crear la cuenta se envía después. El ancla sigue
// siendo #demo para no romper enlaces viejos. /login no se enlaza desde la página pública.
export const CONTRATAR_HREF = "/#demo";

// Datos de contacto y marca de la página pública. Lo que va entre corchetes falta por llenar.
export const BRAND = "Reportes";

export const WHATSAPP_NUMBER = "573002823551"; // Con indicativo (57) y sin signos.
export const WHATSAPP_MESSAGE = "Hola, quiero ver una demo de Reportes";
export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export const CONTACT_EMAIL = "heynohay@gmail.com";

// Enlaces del menú. Llevan "/" delante para que también funcionen desde /terminos y /privacidad.
export const NAV_LINKS = [
  { href: "/#recorrido", label: "Tu panel" },
  { href: "/#celular", label: "En el celular" },
  { href: "/#equipo", label: "Tu equipo" },
  { href: "/#precios", label: "Precios" },
] as const;

export const DEMO_HREF = "/#demo";

// Preguntas frecuentes generales. Las páginas de sector suman las suyas (sectores.ts).
export type FaqItem = { q: string; a: string };

export const FAQ: FaqItem[] = [
  { q: "¿Funciona sin internet?", a: "Sí. La app del técnico guarda todo en el celular y lo envía cuando vuelve la señal." },
  {
    q: "¿El técnico tiene que instalar algo?",
    a: "Sí, una app en su celular Android [confirmar iPhone]. El panel funciona desde el navegador, sin instalar nada.",
  },
  {
    q: "¿Sirve para mi tipo de empresa?",
    a: "Si tus técnicos hacen trabajos donde el cliente, sí. Tú defines tus tipos de trabajo, listas de chequeo y materiales.",
  },
  { q: "¿Qué recibe mi cliente?", a: "Un enlace por WhatsApp con fotos, firma, PDF y la opción de calificar el servicio." },
  { q: "¿Mis datos están seguros?", a: "Cada empresa solo ve sus propios datos y la información viaja cifrada." },
  { q: "¿Cuánto cuesta?", a: "[$ precio] por técnico al mes. Puedes probar 14 días gratis [confirmar]." },
];

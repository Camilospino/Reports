// Textos de cada sector (aprobados en el documento de la fase 1). Agregar un sector = agregar
// una entrada aquí: la pestaña de "Para quién es" y su página /para/<slug> salen de estos datos.
// Lo que va entre corchetes falta por llenar; "[Pendiente: …]" es algo que la app todavía no hace.

export type Sector = {
  slug: string;
  leadType: string; // valor del tipo de empresa en el formulario de demo
  name: string;
  tabExample: string;
  title: string;
  subtitle: string;
  problems: { title: string; text: string }[];
  order: {
    name: string;
    checklist: string[];
    photos: string;
    materials: string[];
    times: string;
  };
  faq: { q: string; a: string }[];
  seoTitle: string;
  seoDescription: string;
};

export const SECTORES: Sector[] = [
  {
    slug: "aire-acondicionado",
    leadType: "aire",
    name: "Aire acondicionado",
    tabExample: "Mantenimiento de un minisplit: limpieza, presión del gas y prueba, con foto antes y después.",
    title: "Cada mantenimiento de aire, con foto antes y después.",
    subtitle: "Agenda tus visitas, controla el gas y los repuestos, y entrégale al cliente un reporte con firma.",
    problems: [
      { title: "¿Se limpió de verdad?", text: "Sin foto antes y después, el cliente duda del trabajo." },
      { title: "El gas y los repuestos se pierden", text: "No sabes cuánto refrigerante se usó en cada visita." },
      { title: "Garantías sin pruebas", text: "Cuando el equipo falla, no tienes cómo mostrar qué se hizo y cuándo." },
    ],
    order: {
      name: "Mantenimiento preventivo de minisplit 12.000 BTU",
      checklist: ["Limpieza de filtros", "Lavado del serpentín", "Medición de presión", "Revisión del drenaje", "Prueba de funcionamiento"],
      photos: "Antes y después",
      materials: ["Refrigerante R-410A · [cantidad]", "Limpiador de serpentín"],
      times: "En camino 08:20 · Inicio 08:47 · Terminado 10:12",
    },
    faq: [
      { q: "¿Puedo llevar el control del gas?", a: "Sí. Lo registras como material del inventario y se descuenta al cerrar cada orden." },
      { q: "¿Sirve para equipos comerciales y cuartos fríos?", a: "Sí. Tú creas tus tipos de trabajo y sus listas de chequeo." },
      {
        q: "¿Puedo programar mantenimientos cada 3 o 6 meses?",
        a: "[Pendiente: hoy cada visita se crea por separado; los mantenimientos programados están en el plan.]",
      },
      { q: "¿El cliente ve el reporte?", a: "Sí. Le llega por WhatsApp con fotos, firma y PDF." },
    ],
    seoTitle: "Tecnio para aire acondicionado · Mantenimientos con foto y firma",
    seoDescription:
      "Agenda mantenimientos de aire acondicionado, controla el gas y los repuestos, y entrega al cliente un reporte con fotos antes y después y su firma.",
  },
  {
    slug: "seguridad-electronica",
    leadType: "seguridad",
    name: "Seguridad electrónica",
    tabExample: "Instalación de 4 cámaras: ubicación, prueba de grabación y firma del cliente.",
    title: "Cada instalación de cámaras, probada y firmada.",
    subtitle: "Asigna instalaciones y visitas de soporte, controla los equipos que salen de bodega y entrégale al cliente la evidencia.",
    problems: [
      { title: "¿Quedó grabando?", text: "El cliente llama días después porque una cámara no graba, y no hay prueba de la entrega." },
      { title: "Equipos que no cuadran", text: "Cámaras, grabadores y cable salen de bodega y nadie sabe dónde quedaron." },
      { title: "Soporte sin control", text: "No sabes cuánto se demora cada técnico en atender una falla." },
    ],
    order: {
      name: "Instalación de 4 cámaras",
      checklist: [
        "Ubicación acordada con el cliente",
        "Cableado y canaleta",
        "Configuración del grabador",
        "Prueba de grabación",
        "App del cliente configurada",
      ],
      photos: "Cada cámara instalada y la pantalla del grabador",
      materials: ["Cámara [referencia] × 4", "Grabador × 1", "Cable UTP · [metros]"],
      times: "En camino 08:20 · Inicio 08:47 · Terminado 12:30",
    },
    faq: [
      { q: "¿Sirve para alarmas y control de acceso?", a: "Sí. Creas un tipo de trabajo para cada uno, con su lista de chequeo." },
      { q: "¿Funciona en una obra sin señal?", a: "Sí. La app guarda todo y lo envía cuando vuelve la señal." },
      {
        q: "¿Puedo guardar el serial de cada equipo?",
        a: "[Pendiente: hoy se anota en las observaciones de la orden; el registro de equipos por cliente está en el plan.]",
      },
      { q: "¿El cliente recibe la evidencia?", a: "Sí. Un enlace por WhatsApp con las fotos, la firma y el PDF." },
    ],
    seoTitle: "Tecnio para seguridad electrónica · Instalaciones probadas y firmadas",
    seoDescription:
      "Organiza instalaciones de cámaras y alarmas, controla los equipos que salen de bodega y entrega al cliente la evidencia con fotos y firma.",
  },
  {
    slug: "internet",
    leadType: "internet",
    name: "Internet",
    tabExample: "Falla de fibra: diagnóstico, empalme, medición de potencia y foto del equipo funcionando.",
    title: "Cada instalación y cada falla, con evidencia.",
    subtitle: "Organiza a tus técnicos de fibra, controla los materiales y cierra cada visita con foto y firma.",
    problems: [
      { title: "Clientes sin servicio esperando", text: "No sabes qué falla lleva más tiempo sin atender." },
      { title: "Materiales que desaparecen", text: "Metros de fibra, conectores y routers salen sin control." },
      { title: "Instalaciones sin respaldo", text: "Si el cliente reclama, no hay foto de la potencia ni del equipo instalado." },
    ],
    order: {
      name: "Instalación de fibra hogar · [Plan]",
      checklist: ["Tendido de la acometida", "Conectorización", "Medición de potencia", "Configuración del router", "Prueba de velocidad"],
      photos: "Medición de potencia, router instalado y prueba de velocidad",
      materials: ["Fibra drop · [metros]", "Conector SC/APC × 2", "Equipo ONT × 1"],
      times: "En camino 08:20 · Inicio 08:47 · Terminado 10:12",
    },
    faq: [
      { q: "¿Sirve para instalaciones, fallas, traslados y retiros?", a: "Sí. Cada uno es un tipo de trabajo con su propia lista de chequeo." },
      { q: "¿Qué pasa en una caída masiva?", a: "[Pendiente: hoy cada falla es una orden; agrupar fallas por zona está en el plan.]" },
      {
        q: "¿El cliente puede reportar la falla solo?",
        a: "[Pendiente: hoy la orden la crea el despachador; el reporte del cliente está en el plan.]",
      },
      { q: "¿Se conecta con mi sistema de facturación?", a: "[Pendiente: se confirma con cada empresa.]" },
    ],
    seoTitle: "Tecnio para internet y telecomunicaciones · Instalaciones y fallas con evidencia",
    seoDescription:
      "Organiza a tus técnicos de fibra, controla fibra, conectores y routers, y cierra cada instalación o falla con foto de la potencia y firma del cliente.",
  },
];

export const findSector = (slug: string) => SECTORES.find((s) => s.slug === slug);

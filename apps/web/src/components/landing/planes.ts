// Fuente única de los planes y precios. La sección Precios, las Preguntas frecuentes y los
// Términos importan de aquí: ningún precio se escribe a mano en otro lugar.
// Los nombres coinciden con companies.plan en la base de datos.

export type Plan = {
  name: "Arranque" | "Equipo" | "Empresa";
  /** Precio mensual en pesos colombianos, cobrado por adelantado. */
  price: number;
  /** Máximo de técnicos incluidos. */
  technicians: number;
  features: string[];
  featured?: boolean;
};

export const PLANES: Plan[] = [
  {
    name: "Arranque",
    price: 99_000,
    technicians: 3,
    features: ["Panel y app del técnico", "Reporte al cliente con fotos y firma"],
  },
  {
    name: "Equipo",
    price: 199_000,
    technicians: 10,
    features: ["Todo lo de Arranque", "Agenda con técnico sugerido", "Inventario y cotizaciones", "Reportes del mes"],
    featured: true,
  },
  {
    name: "Empresa",
    price: 349_000,
    technicians: 25,
    features: ["Todo lo de Equipo", "Acompañamiento en la puesta en marcha"],
  },
];

/** Técnicos del plan más grande: por encima de esto, se habla directo con la empresa. */
export const MAX_TECNICOS = Math.max(...PLANES.map((p) => p.technicians));

/** Precio del plan más barato. */
export const PRECIO_DESDE = Math.min(...PLANES.map((p) => p.price));

/** "$99.000": punto de miles, sin decimales. Sin Intl para que el servidor y el navegador den lo mismo. */
export const formatCOP = (value: number) => `$${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

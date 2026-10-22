"use client";

import { DEMO_HREF, SIGNUP_HREF } from "./config";
import { track } from "./analytics";
import { WhatsappLink } from "./whatsapp";
import ui from "./landing.module.css";
import styles from "./precios.module.css";

// Nombres de plan que ya usa la app (companies.plan). Qué funciones van en cada uno está por decidir.
const PLANS = [
  {
    name: "Arranque",
    price: "[$ precio]",
    features: ["Hasta [N] técnicos", "Panel y app del técnico", "Reporte al cliente con fotos y firma"],
    cta: "Probar 14 días gratis",
    signup: true,
  },
  {
    name: "Equipo",
    price: "[$ precio]",
    features: ["Hasta [N] técnicos", "Agenda con técnico sugerido", "Inventario y cotizaciones", "Reportes del mes"],
    cta: "Agendar demo",
    featured: true,
  },
  {
    name: "Empresa",
    price: "A medida",
    features: ["Más de [N] técnicos", "Acompañamiento en la puesta en marcha"],
    cta: "Hablemos",
    whatsapp: true,
  },
];

export function Precios() {
  return (
    <section id="precios" aria-labelledby="precios-titulo" className={`${ui.section} ${ui.light}`}>
      <div className={ui.container}>
        <h2 id="precios-titulo" className={ui.h2}>
          Precios por técnico. Sin sorpresas.
        </h2>

        <ul className={styles.grid}>
          {PLANS.map((p) => (
            <li key={p.name} className={`${styles.plan} ${p.featured ? styles.featured : ""}`}>
              {p.featured && <p className={styles.badge}>Recomendado [confirmar]</p>}
              <h3 className={styles.name}>{p.name}</h3>
              <p className={styles.price}>{p.price}</p>
              {p.price !== "A medida" && <p className={styles.per}>por técnico al mes</p>}
              <ul className={styles.features}>
                {p.features.map((f) => (
                  <li key={f}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {p.whatsapp ? (
                <WhatsappLink className={`${ui.btn} ${ui.btnOutline} ${styles.cta}`} lugar={`plan ${p.name}`}>
                  {p.cta}
                </WhatsappLink>
              ) : p.signup ? (
                <a
                  href={SIGNUP_HREF}
                  onClick={() => track("clic probar gratis", { lugar: `plan ${p.name}` })}
                  className={`${ui.btn} ${ui.btnOutline} ${styles.cta}`}
                >
                  {p.cta}
                </a>
              ) : (
                <a
                  href={DEMO_HREF}
                  onClick={() => track("clic agendar demo", { lugar: `plan ${p.name}` })}
                  className={`${ui.btn} ${styles.cta} ${p.featured ? `${ui.btnAmber} ${ui.pulse}` : ui.btnOutline}`}
                >
                  {p.cta}
                </a>
              )}
            </li>
          ))}
        </ul>

        <p className={styles.note}>Precios pendientes de definir.</p>
      </div>
    </section>
  );
}

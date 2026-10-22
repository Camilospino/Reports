"use client";

import { DEMO_HREF } from "./config";
import { track } from "./analytics";
import { WhatsappLink } from "./whatsapp";
import ui from "./landing.module.css";
import styles from "./precios.module.css";

const PLANS = [
  {
    name: "Una propiedad",
    price: "[$ precio]",
    features: ["Panel del dueño", "Hasta [N] técnicos", "Historial con fotos"],
    cta: "Empezar",
  },
  {
    name: "Varias propiedades",
    price: "[$ precio]",
    features: ["Todas tus propiedades", "Comparación entre propiedades", "Tiempos por técnico"],
    cta: "Agendar demo",
    featured: true,
  },
  {
    name: "Administradoras",
    price: "A medida",
    features: ["Muchas propiedades", "Acompañamiento"],
    cta: "Hablemos",
    whatsapp: true,
  },
];

export function Precios() {
  return (
    <section id="precios" aria-labelledby="precios-titulo" className={`${ui.section} ${ui.light}`}>
      <div className={ui.container}>
        <h2 id="precios-titulo" className={ui.h2}>
          Planes para dueños
        </h2>

        <ul className={styles.grid}>
          {PLANS.map((p) => (
            <li key={p.name} className={`${styles.plan} ${p.featured ? styles.featured : ""}`}>
              {p.featured && <p className={styles.badge}>Recomendado [confirmar]</p>}
              <h3 className={styles.name}>{p.name}</h3>
              <p className={styles.price}>{p.price}</p>
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

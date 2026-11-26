"use client";

import { CONTRATAR_HREF } from "./config";
import { track } from "./analytics";
import { WhatsappLink } from "./whatsapp";
import { MAX_TECNICOS, PLANES, formatCOP } from "./planes";
import ui from "./landing.module.css";
import styles from "./precios.module.css";

// Planes y precios: vienen de planes.ts (fuente única, también la usan Preguntas y Términos).
export function Precios() {
  return (
    <section id="precios" aria-labelledby="precios-titulo" className={`${ui.section} ${ui.light}`}>
      <div className={ui.container}>
        <h2 id="precios-titulo" className={ui.h2}>
          Precios claros. Sin sorpresas.
        </h2>

        <ul className={styles.grid}>
          {PLANES.map((p) => (
            <li key={p.name} className={`${styles.plan} ${p.featured ? styles.featured : ""}`}>
              {p.featured && <p className={styles.badge}>Recomendado</p>}
              <h3 className={styles.name}>{p.name}</h3>
              <p className={styles.price}>
                {formatCOP(p.price)}
                <span className={styles.per}>COP / mes</span>
              </p>
              <ul className={styles.features}>
                {[`Hasta ${p.technicians} técnicos`, ...p.features].map((f) => (
                  <li key={f}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={CONTRATAR_HREF}
                onClick={() => track("clic contratar", { lugar: `plan ${p.name}` })}
                className={`${ui.btn} ${styles.cta} ${p.featured ? `${ui.btnAmber} ${ui.pulse}` : ui.btnOutline}`}
              >
                Contratar
              </a>
            </li>
          ))}
        </ul>

        <p className={styles.note}>
          ¿Más de {MAX_TECNICOS} técnicos?{" "}
          <WhatsappLink className={styles.noteLink} lugar="precios más técnicos">
            Escríbenos
          </WhatsappLink>
        </p>
      </div>
    </section>
  );
}

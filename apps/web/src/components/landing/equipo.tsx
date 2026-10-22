"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/use-in-view";
import ui from "./landing.module.css";
import styles from "./equipo.module.css";

export function Equipo() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} id="equipo" aria-labelledby="equipo-titulo" className={`${ui.section} ${inView ? "" : ui.paused}`}>
      <div className={ui.container}>
        <h2 id="equipo-titulo" className={`${ui.h2} ${styles.title}`}>
          Tu equipo alimenta tu panel. Tú no haces nada.
        </h2>
        <p className={`${ui.lead} ${styles.sub}`}>Una foto. Tres personas. Un solo registro.</p>

        <ul className={styles.grid}>
          <li className={`${ui.card} ${styles.card}`}>
            <div className={styles.art} aria-hidden="true">
              <div className={styles.miniPhone}>
                <span className={styles.lens} />
                <span className={styles.flash} />
              </div>
            </div>
            <p className={styles.tag}>01 · Quien reporta</p>
            <h3 className={styles.cardTitle}>Toma la foto y listo.</h3>
            <p className={styles.cardText}>Residentes, empleados o personal, desde el celular.</p>
          </li>

          <li className={`${ui.card} ${styles.card}`}>
            <div className={styles.art} aria-hidden="true">
              <svg className={styles.wrench} width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <p className={styles.tag}>02 · Técnico</p>
            <h3 className={styles.cardTitle}>Un toque por paso.</h3>
            <p className={styles.cardText}>Toma, inicia y termina. Cada toque guarda la hora.</p>
          </li>

          <li className={`${ui.card} ${styles.card} ${styles.owner}`}>
            <div className={styles.art} aria-hidden="true">
              <div className={styles.bars}>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} style={{ "--i": i } as React.CSSProperties} />
                ))}
              </div>
            </div>
            <p className={styles.tag}>03 · Tú, el dueño</p>
            <h3 className={styles.cardTitle}>Lo ves todo en tu panel.</h3>
            <p className={styles.cardText}>Qué, dónde, quién y cuánto tardó.</p>
          </li>
        </ul>
      </div>
    </section>
  );
}

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
          Cada uno hace su parte. Tú lo ves todo.
        </h2>
        <p className={`${ui.lead} ${styles.sub}`}>Tres roles, un solo registro.</p>

        <ul className={styles.grid}>
          <li className={`${ui.card} ${styles.card}`}>
            <div className={styles.art} aria-hidden="true">
              {/* Mini agenda: una orden se arrastra hasta su espacio. */}
              <div className={styles.calendar}>
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className={styles.slot} />
                ))}
                <span className={styles.dragged} />
              </div>
            </div>
            <p className={styles.tag}>01 · Despachador</p>
            <h3 className={styles.cardTitle}>Crea y asigna en segundos.</h3>
            <p className={styles.cardText}>Recibe el pedido, lo agenda y lo asigna al técnico indicado.</p>
          </li>

          <li className={`${ui.card} ${styles.card}`}>
            <div className={styles.art} aria-hidden="true">
              <svg className={styles.wrench} width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <p className={styles.tag}>02 · Técnico</p>
            <h3 className={styles.cardTitle}>Un toque por paso.</h3>
            <p className={styles.cardText}>En camino, en proceso, terminado. Cada toque guarda la hora y la ubicación.</p>
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
            <p className={styles.cardText}>Qué se hizo, quién lo hizo, cuánto tardó y cuánto se facturó.</p>
          </li>
        </ul>
      </div>
    </section>
  );
}

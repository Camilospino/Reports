"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-scroll-progress";
import ui from "./landing.module.css";
import styles from "./celular.module.css";

const TICK_MS = 2400;

// Actividad de ejemplo. Cada 2,4 s entra una nueva arriba y la última sale.
const EVENTS = [
  { title: "Terminado", detail: "Daño en la fibra · 10:12", tone: "ok" },
  { title: "Nuevo reporte con foto", detail: "[Ubicación] · 09:58", tone: "alert" },
  { title: "Técnico inició", detail: "Bocagrande · 09:40", tone: "progress" },
  { title: "Sin tomar hace 1 h", detail: "[Ubicación] · 09:05", tone: "pending" },
] as const;

const POINTS = ["Lo de hoy en una pantalla", "Lo que necesita tu atención, primero", "La foto de cada arreglo, a un toque"];

export function Celular() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [inView, reduced]);

  // Las tres más recientes: la del tick actual arriba.
  const visible = [0, 1, 2].map((i) => {
    const n = tick - i;
    return { key: n, ...EVENTS[((n % EVENTS.length) + EVENTS.length) % EVENTS.length] };
  });

  return (
    <section ref={ref} id="celular" aria-labelledby="celular-titulo" className={`${ui.section} ${inView ? "" : ui.paused}`}>
      <div className={`${ui.container} ${styles.layout}`}>
        <div>
          <p className={ui.eyebrow}>También en tu celular</p>
          <h2 id="celular-titulo" className={`${ui.h2} ${styles.title}`}>
            Revisa tu propiedad mientras esperas un café.
          </h2>
          <p className={`${ui.lead} ${styles.lead}`}>
            El mismo panel, adaptado a la pantalla del celular. Sin instalar nada. [confirmar]
          </p>
          <ul className={styles.points}>
            {POINTS.map((p) => (
              <li key={p}>
                <span className={styles.check} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.phoneWrap} aria-hidden="true">
          <div className={styles.phone}>
            <div className={styles.screen}>
              <div className={styles.island} />
              <p className={styles.hello}>Hola, [Nombre]</p>
              <p className={styles.place}>Apartamento · hoy</p>
              <p className={styles.sample}>Datos de ejemplo</p>

              <div className={styles.kpis}>
                <div className={styles.kpi}>
                  <span>Abiertos</span>
                  <strong>4</strong>
                </div>
                <div className={`${styles.kpi} ${styles.kpiOk}`}>
                  <span>Terminados</span>
                  <strong>12</strong>
                </div>
              </div>

              <p className={styles.feedTitle}>Actividad reciente</p>
              {/* La lista se vuelve a montar en cada cambio: la nueva entra desde arriba y las demás bajan. */}
              <ul key={tick} className={styles.feed}>
                {visible.map((e, i) => (
                  <li key={e.key} className={`${styles.event} ${styles[e.tone]} ${i === 0 ? styles.eventFirst : ""}`}>
                    <span className={styles.dot} />
                    <span className={styles.eventText}>
                      <strong>{e.title}</strong>
                      <span>{e.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

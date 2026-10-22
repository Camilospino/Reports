"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-scroll-progress";
import ui from "./landing.module.css";
import styles from "./celular.module.css";

const TICK_MS = 2000;

const CHECKLIST = ["Revisión inicial", "[Paso 2 del trabajo]", "[Paso 3 del trabajo]", "Prueba final"];

// Estado de la conexión que va mostrando la app: guarda sin señal y envía cuando vuelve.
const SYNC = [
  { label: "Sin señal · cambios guardados en el celular", tone: "pending" },
  { label: "Volvió la señal · enviando…", tone: "progress" },
  { label: "Todo enviado", tone: "ok" },
] as const;

const POINTS = ["Sus órdenes del día, con dirección y hora", "Fotos, lista de chequeo y materiales en cada orden", "La firma del cliente en la pantalla"];

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

  // La lista se va marcando paso a paso; al completarse vuelve a empezar.
  const done = reduced ? CHECKLIST.length : tick % (CHECKLIST.length + 2);
  const sync = SYNC[reduced ? 2 : Math.min(2, Math.floor((tick % 9) / 3))];

  return (
    <section ref={ref} id="app-tecnico" aria-labelledby="app-tecnico-titulo" className={`${ui.section} ${inView ? "" : ui.paused}`}>
      <div className={`${ui.container} ${styles.layout}`}>
        <div>
          <p className={ui.eyebrow}>La app del técnico</p>
          <h2 id="app-tecnico-titulo" className={`${ui.h2} ${styles.title}`}>
            Funciona hasta en un sótano sin señal.
          </h2>
          <p className={`${ui.lead} ${styles.lead}`}>
            El técnico ve sus órdenes del día, marca cada paso y cierra con fotos y firma. Si no hay internet, todo se guarda y se envía
            solo cuando vuelve la señal.
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
              <p className={styles.place}>3 órdenes hoy</p>
              <p key={sync.label} className={`${styles.sync} ${styles[sync.tone]}`}>
                <span className={styles.dot} />
                {sync.label}
              </p>

              <div className={styles.order}>
                <div className={styles.orderHead}>
                  <strong>[Tipo de trabajo]</strong>
                  <span className={styles.orderTime}>08:47</span>
                </div>
                <p className={styles.orderMeta}>[Cliente] · [Barrio]</p>
                <ul className={styles.checklist}>
                  {CHECKLIST.map((c, i) => (
                    <li key={c} className={i < done ? styles.checked : undefined}>
                      <span className={styles.box}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
                <div className={styles.actions}>
                  <span>Tomar foto</span>
                  <span>Firma del cliente</span>
                </div>
              </div>

              <p className={styles.feedTitle}>Después</p>
              <ul className={styles.next}>
                <li>
                  <span>[Tipo de trabajo] · [Cliente]</span>
                  <span className={styles.orderTime}>11:00</span>
                </li>
                <li>
                  <span>[Tipo de trabajo] · [Cliente]</span>
                  <span className={styles.orderTime}>14:30</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

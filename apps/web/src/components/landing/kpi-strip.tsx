"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-scroll-progress";
import ui from "./landing.module.css";
import styles from "./kpi-strip.module.css";

// Valores de ejemplo que van rotando para dar sensación de "en vivo".
const TODAY = [14, 15, 15, 16];
const DONE = [9, 9, 10, 11];
const TICK_MS = 2400;

const AUDIENCE = ["Aire acondicionado", "Seguridad electrónica", "Internet y telecomunicaciones", "Electricidad y plomería", "Mantenimiento de equipos"];

export function KpiStrip() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [tick, setTick] = useState(0);

  // Solo rota mientras la franja se ve y si el usuario no pidió menos movimiento.
  useEffect(() => {
    if (!inView || reduced) return;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [inView, reduced]);

  const today = TODAY[tick % TODAY.length];
  const done = DONE[tick % DONE.length];

  return (
    <section ref={ref} aria-label="Cifras de ejemplo del panel" className={`${styles.strip} ${inView ? "" : ui.paused}`}>
      <dl className={`${ui.container} ${styles.grid}`}>
        <Kpi label="Órdenes de hoy" value={today} note="datos de ejemplo" />
        <Kpi label="Completadas hoy" value={done} note="con foto y firma" tone={styles.ok} />
        <Kpi label="Técnicos en campo" value={6} note="reportando desde su celular" />
        <Kpi label="Atrasadas" value={1} note="no arrancaron a tiempo" tone={styles.warn} />
      </dl>

      <div className={styles.marquee}>
        {/* Dos copias seguidas: al moverse la mitad del ancho, la segunda ocupa el lugar de la primera. */}
        <div className={styles.track}>
          <AudienceList />
          <AudienceList hidden />
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, note, tone }: { label: string; value: number | string; note: string; tone?: string }) {
  return (
    <div className={styles.kpi}>
      <dt className={styles.label}>{label}</dt>
      <dd className={`${styles.value} ${tone ?? ""}`}>
        {/* La key cambia con el valor: el número vuelve a montarse y entra con su animación. */}
        <span key={value} className={styles.number}>
          {value}
        </span>
      </dd>
      <dd className={styles.note}>{note}</dd>
    </div>
  );
}

function AudienceList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className={styles.list} aria-hidden={hidden || undefined}>
      <li className={styles.lead}>Para empresas de</li>
      {AUDIENCE.map((a) => (
        <li key={a} className={styles.item}>
          <span className={styles.dot} aria-hidden="true" />
          {a}
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/use-in-view";
import ui from "./landing.module.css";
import styles from "./problema.module.css";

type Bubble = { text?: string; mine?: boolean; typing?: boolean; shake?: boolean };

const CARDS: { chat: Bubble[]; title: string; text: string }[] = [
  {
    chat: [{ text: "¿Alguien ya fue a ver?", shake: true }, { typing: true }],
    title: "Nadie sabe quién lo tomó",
    text: "Van dos técnicos al mismo daño, o no va ninguno.",
  },
  {
    chat: [{ text: "Mandé foto arriba", mine: true }, { text: "No me carga la foto", shake: true }],
    title: "La evidencia se pierde",
    text: "La foto queda en el celular de alguien o en un chat viejo.",
  },
  {
    chat: [{ text: "¿Cuándo lo arreglaron?", mine: true }, { text: "Creo que ayer…", shake: true }],
    title: "No hay tiempos reales",
    text: "No sabes cuánto tarda un arreglo ni dónde se atasca.",
  },
];

export function Problema() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} aria-labelledby="problema-titulo" className={`${ui.section} ${inView ? "" : ui.paused}`}>
      <div className={ui.container}>
        <div className={styles.head}>
          <div>
            <p className={ui.eyebrow}>El problema</p>
            <h2 id="problema-titulo" className={`${ui.h2} ${styles.title}`}>
              Sin foto, sin hora y sin responsable, un daño es solo un rumor.
            </h2>
          </div>
          <p className={ui.lead}>Así se enteran hoy la mayoría de dueños de lo que pasa en su propiedad.</p>
        </div>

        <ul className={styles.grid}>
          {CARDS.map((c) => (
            <li key={c.title} className={`${ui.card} ${styles.card}`}>
              <div className={styles.chat} aria-hidden="true">
                {c.chat.map((b, i) => (
                  <p
                    key={i}
                    className={[styles.bubble, b.mine ? styles.mine : styles.theirs, b.shake && styles.shake].filter(Boolean).join(" ")}
                  >
                    {b.typing ? (
                      <span className={styles.typing}>
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      b.text
                    )}
                  </p>
                ))}
              </div>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardText}>{c.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

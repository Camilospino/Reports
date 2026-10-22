"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/use-in-view";
import ui from "./landing.module.css";
import styles from "./problema.module.css";

type Bubble = { text?: string; mine?: boolean; typing?: boolean; shake?: boolean };

const CARDS: { chat: Bubble[]; title: string; text: string }[] = [
  {
    chat: [{ text: "¿Quién va donde el cliente de las 10?", shake: true }, { typing: true }],
    title: "Nadie sabe quién va",
    text: "Dos técnicos llegan al mismo cliente, o el cliente se queda esperando.",
  },
  {
    chat: [{ text: "¿Ya llegaste?", mine: true }, { text: "Voy en camino…", shake: true }],
    title: "No sabes dónde están",
    text: "Llamas a cada técnico para saber si llegó o si terminó.",
  },
  {
    chat: [{ text: "Mándame la foto del trabajo", mine: true }, { text: "Se me olvidó tomarla", shake: true }],
    title: "La evidencia se pierde",
    text: "Sin foto ni firma, un reclamo del cliente es tu palabra contra la suya.",
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
              Si todo pasa por el chat del grupo, nadie sabe qué pasó de verdad.
            </h2>
          </div>
          <p className={ui.lead}>Así se coordinan hoy muchas empresas con técnicos en la calle.</p>
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

"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/use-in-view";
import ui from "./landing.module.css";
import styles from "./dejas-de-hacer.module.css";

const ITEMS = [
  "Llamar al técnico para saber si llegó",
  "Buscar fotos en el chat del grupo",
  "Guardar firmas en papel",
  "Contar a mano los materiales del mes",
  "Discutir un reclamo sin pruebas",
];

export function DejasDeHacer() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} aria-labelledby="dejas-titulo" className={`${ui.section} ${ui.light} ${inView ? "" : ui.paused}`}>
      <div className={ui.container}>
        <h2 id="dejas-titulo" className={ui.h2}>
          Lo que dejas de hacer
        </h2>
        <ul className={styles.list}>
          {ITEMS.map((item, i) => (
            <li key={item} className={styles.row}>
              {/* El retraso escalonado hace que se tachen una tras otra. */}
              <span className={styles.phraseBox}>
                <span className={styles.phrase} style={{ "--i": i } as React.CSSProperties}>
                  {item}
                </span>
              </span>
              <span className={styles.no}>Ya no</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

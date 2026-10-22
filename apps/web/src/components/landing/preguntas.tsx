"use client";

import { useState } from "react";
import ui from "./landing.module.css";
import styles from "./preguntas.module.css";

const FAQ = [
  { q: "¿Tengo que estar en la propiedad?", a: "No. Ves el panel desde tu celular o computador." },
  { q: "¿Mi equipo tiene que instalar algo?", a: "No. Todo funciona desde el navegador. [confirmar]" },
  { q: "¿Las fotos quedan guardadas?", a: "Sí. Cada reporte conserva su foto como evidencia." },
  { q: "¿Puedo ver varias propiedades?", a: "[Pendiente: confirmar si se ofrece]." },
  { q: "¿Cuánto cuesta?", a: "[Pendiente: precio por propiedad o cotización]." },
];

export function Preguntas() {
  // La primera viene abierta; se pueden abrir varias a la vez.
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section aria-labelledby="preguntas-titulo" className={ui.section}>
      <div className={`${ui.container} ${styles.layout}`}>
        <h2 id="preguntas-titulo" className={ui.h2}>
          Preguntas de dueños
        </h2>

        <div className={styles.list}>
          {FAQ.map((item, i) => {
            const isOpen = open.has(i);
            return (
              <div key={item.q} className={styles.item}>
                <h3>
                  <button
                    type="button"
                    id={`pregunta-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`respuesta-${i}`}
                    className={styles.question}
                    onClick={() => toggle(i)}
                  >
                    {item.q}
                    <svg className={styles.plus} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </h3>
                <div id={`respuesta-${i}`} role="region" aria-labelledby={`pregunta-${i}`} hidden={!isOpen} className={styles.answer}>
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

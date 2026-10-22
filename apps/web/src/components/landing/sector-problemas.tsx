import type { Sector } from "./sectores";
import ui from "./landing.module.css";
import styles from "./sector-problemas.module.css";

// Los tres problemas típicos del sector.
export function SectorProblemas({ sector }: { sector: Sector }) {
  return (
    <section aria-labelledby="sector-problemas-titulo" className={`${ui.section} ${ui.light}`}>
      <div className={ui.container}>
        <p className={ui.eyebrow}>El problema</p>
        <h2 id="sector-problemas-titulo" className={`${ui.h2} ${styles.title}`}>
          Lo que pasa hoy en muchas empresas de {sector.name.toLowerCase()}.
        </h2>
        <ol className={styles.grid}>
          {sector.problems.map((p, i) => (
            <li key={p.title} className={styles.card}>
              <span className={styles.n} aria-hidden="true">
                0{i + 1}
              </span>
              <h3 className={styles.cardTitle}>{p.title}</h3>
              <p className={styles.cardText}>{p.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

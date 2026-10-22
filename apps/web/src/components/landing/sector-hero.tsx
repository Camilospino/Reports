"use client";

import { DEMO_HREF, SIGNUP_HREF } from "./config";
import { track } from "./analytics";
import { OrderCard } from "./para-quien";
import type { Sector } from "./sectores";
import ui from "./landing.module.css";
import styles from "./sector-hero.module.css";

// Portada de /para/<sector>: el título del sector y su orden de ejemplo, como se ve en el panel.
export function SectorHero({ sector }: { sector: Sector }) {
  return (
    <section aria-labelledby="sector-titulo" className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={`${ui.container} ${styles.layout}`}>
        <div>
          <p className={ui.eyebrow}>Tecnio para {sector.name.toLowerCase()}</p>
          <h1 id="sector-titulo" className={styles.title}>
            {sector.title}
          </h1>
          <p className={styles.subtitle}>{sector.subtitle}</p>
          <div className={styles.actions}>
            <a
              href={DEMO_HREF}
              onClick={() => track("clic agendar demo", { lugar: "portada sector" })}
              className={`${ui.btn} ${ui.btnAmber} ${ui.pulse}`}
            >
              Agendar demo
            </a>
            <a href={SIGNUP_HREF} onClick={() => track("clic probar gratis", { lugar: "portada sector" })} className={`${ui.btn} ${ui.btnOutline}`}>
              Probar 14 días gratis
            </a>
          </div>
        </div>
        <div className={styles.card}>
          <OrderCard order={sector.order} />
        </div>
      </div>
    </section>
  );
}

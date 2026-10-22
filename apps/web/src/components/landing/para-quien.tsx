"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { DEMO_HREF } from "./config";
import { SECTORES } from "./sectores";
import ui from "./landing.module.css";
import styles from "./para-quien.module.css";

// Las pestañas: los sectores con página propia y una más para el resto.
const TABS = [
  ...SECTORES.map((s) => ({ id: s.slug, name: s.name, sector: s })),
  { id: "otros", name: "Otros sectores", sector: null },
];

export function ParaQuien() {
  const [active, setActive] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS[active];

  const choose = (i: number) => {
    setActive(i);
    tabsRef.current[i]?.focus();
  };

  // Flechas, Inicio y Fin cambian de pestaña (patrón de pestañas accesible).
  const onKeyDown = (e: KeyboardEvent) => {
    const n = TABS.length;
    const next =
      e.key === "ArrowRight" ? (active + 1) % n : e.key === "ArrowLeft" ? (active - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (next === null) return;
    e.preventDefault();
    choose(next);
  };

  return (
    <section id="para-quien" aria-labelledby="para-quien-titulo" className={`${ui.section} ${styles.section}`}>
      <div className={ui.container}>
        <p className={ui.eyebrow}>Para quién es</p>
        <h2 id="para-quien-titulo" className={`${ui.h2} ${styles.title}`}>
          Si tienes técnicos en la calle, es para ti.
        </h2>
        <p className={`${ui.lead} ${styles.lead}`}>El mismo sistema, con los tipos de trabajo de tu sector.</p>

        <div role="tablist" aria-label="Sectores" className={styles.tabs} onKeyDown={onKeyDown}>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              id={`sector-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls="sector-panel"
              tabIndex={i === active ? 0 : -1}
              className={`${styles.tab} ${i === active ? styles.tabOn : ""}`}
              onClick={() => setActive(i)}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div id="sector-panel" role="tabpanel" aria-labelledby={`sector-tab-${tab.id}`} className={styles.panel} key={tab.id}>
          {tab.sector ? (
            <>
              <div className={styles.copy}>
                <h3 className={styles.panelTitle}>{tab.sector.title}</h3>
                <p className={styles.panelText}>{tab.sector.tabExample}</p>
                <Link href={`/para/${tab.sector.slug}`} className={`${ui.btn} ${ui.btnAmber} ${styles.cta}`}>
                  Ver Tecnio para {tab.sector.name.toLowerCase()}
                  <Arrow />
                </Link>
              </div>
              <OrderCard order={tab.sector.order} />
            </>
          ) : (
            <div className={styles.copy}>
              <h3 className={styles.panelTitle}>Electricidad, plomería, ascensores, fumigación…</h3>
              <p className={styles.panelText}>
                Tú creas tus tipos de trabajo y sus listas de chequeo. Si tus técnicos hacen trabajos donde el cliente, Tecnio se adapta a
                tu forma de trabajar.
              </p>
              <a href={DEMO_HREF} className={`${ui.btn} ${ui.btnAmber} ${styles.cta}`}>
                Agendar demo
                <Arrow />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Orden de ejemplo del sector, como se ve en el panel.
export function OrderCard({ order }: { order: (typeof SECTORES)[number]["order"] }) {
  return (
    <div className={styles.order} aria-label="Orden de ejemplo">
      <div className={styles.orderHead}>
        <p className={styles.orderName}>{order.name}</p>
        <span className={styles.orderChip}>Completada</span>
      </div>
      <p className={styles.orderMeta}>[Cliente] · [Barrio] · datos de ejemplo</p>
      <p className={styles.orderLabel}>Lista de chequeo</p>
      <ul className={styles.checklist}>
        {order.checklist.map((c) => (
          <li key={c}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            {c}
          </li>
        ))}
      </ul>
      <p className={styles.orderLabel}>Materiales</p>
      <p className={styles.orderLine}>{order.materials.join(" · ")}</p>
      <p className={styles.orderLabel}>Fotos</p>
      <p className={styles.orderLine}>{order.photos}</p>
      <p className={styles.orderTimes}>{order.times} · Firmado por el cliente</p>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

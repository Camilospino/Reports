"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-scroll-progress";
import ui from "./landing.module.css";
import styles from "./recorrido.module.css";

const STEP_MS = 3500;
const CHIP_MS = 2000;

// Cada nota lleva la pantalla del portátil a una parada (desplazamiento vertical en px).
const NOTES = [
  { tag: "1 · Resumen", title: "Lo de hoy, en una mirada.", text: "Órdenes, técnicos en campo y lo que va atrasado.", stop: 0 },
  { tag: "2 · Agenda", title: "Arrastra y asigna.", text: "La agenda sugiere el técnico según su carga y su especialidad.", stop: 250 },
  { tag: "3 · Inventario", title: "Materiales que se descuentan solos.", text: "Cada orden cerrada descuenta lo que se usó.", stop: 420 },
  { tag: "4 · Detalle", title: "La prueba de cada trabajo.", text: "Fotos, firma del cliente, materiales y la hora de cada paso.", stop: 640 },
];

const WEEK = [
  { day: "L", h: 0.45 },
  { day: "M", h: 0.7 },
  { day: "M", h: 0.55 },
  { day: "J", h: 1, top: true },
  { day: "V", h: 0.75 },
  { day: "S", h: 0.5 },
  { day: "D", h: 0.3 },
];

// Agenda del día: inicio y duración en horas desde las 7:00 (el día va de 7:00 a 17:00).
const AGENDA = [
  { tech: 1, blocks: [{ start: 0.5, len: 2 }, { start: 3, len: 1.5 }, { start: 6, len: 2.5, suggested: true }] },
  { tech: 2, blocks: [{ start: 1, len: 3 }, { start: 5, len: 2 }] },
  { tech: 3, blocks: [{ start: 0, len: 1.5 }, { start: 2.5, len: 2 }, { start: 7, len: 2 }] },
];
const DAY_HOURS = 10;

const STOCK = [
  { name: "[Material 1]", n: 42, max: 60 },
  { name: "[Material 2]", n: 120, max: 200 },
  { name: "[Material 3]", n: 3, max: 30, low: true },
  { name: "[Material 4]", n: 18, max: 40 },
  { name: "[Material 5]", n: 25, max: 50 },
];

const CHIPS = [
  { label: "Disponible", tone: "ok" },
  { label: "En camino", tone: "pending" },
  { label: "En proceso", tone: "progress" },
] as const;

export function Recorrido() {
  const ref = useRef<HTMLElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(ref, "0px");
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);
  const running = auto && inView && !reduced;

  // Avance automático: arranca cuando la sección se ve y se detiene al elegir una nota.
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % NOTES.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, running]);

  // Estado de los técnicos (rota aunque el recorrido esté detenido, mientras se vea).
  useEffect(() => {
    if (!inView || reduced) return;
    const id = setInterval(() => setTick((t) => t + 1), CHIP_MS);
    return () => clearInterval(id);
  }, [inView, reduced]);

  const choose = (i: number, focus = false) => {
    setAuto(false);
    setActive(i);
    if (focus) tabsRef.current[i]?.focus();
  };

  // Flechas, Inicio y Fin mueven entre notas (patrón de pestañas accesible).
  const onKeyDown = (e: KeyboardEvent) => {
    const last = NOTES.length - 1;
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? (active + 1) % NOTES.length
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? (active - 1 + NOTES.length) % NOTES.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    choose(next, true);
  };

  return (
    <section
      ref={ref}
      id="recorrido"
      aria-labelledby="recorrido-titulo"
      className={`${ui.section} ${ui.light} ${inView ? "" : ui.paused}`}
    >
      <div className={ui.container}>
        <p className={ui.eyebrow}>Tu panel, paso a paso</p>
        <h2 id="recorrido-titulo" className={`${ui.h2} ${styles.title}`}>
          Esto es lo que ves desde la oficina.
        </h2>

        <div className={styles.layout}>
          <div className={styles.laptop}>
            <div className={styles.lid}>
              <div
                id="recorrido-pantalla"
                role="tabpanel"
                aria-labelledby={`recorrido-nota-${active}`}
                className={styles.screen}
              >
                <p className={ui.srOnly}>
                  {NOTES[active].title} {NOTES[active].text}
                </p>
                <aside className={styles.side} aria-hidden="true">
                  <p className={styles.sideBrand}>Tecnio</p>
                  <ul>
                    {["Resumen", "Agenda", "Inventario", "Detalle"].map((s, i) => (
                      <li key={s} className={i === active ? styles.sideActive : undefined}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </aside>
                <div className={styles.viewport} aria-hidden="true">
                  <div className={styles.content} style={{ transform: `translateY(-${NOTES[active].stop}px)` }}>
                    <Zone index={0} active={active}>
                      <div className={styles.kpis}>
                        <Kpi label="Hoy" value="14" />
                        <Kpi label="Completadas" value="9" />
                        <Kpi label="En campo" value="6" />
                        <Kpi label="Atrasadas" value="1" warn />
                      </div>
                      <p className={styles.zoneTitle}>
                        Órdenes de la semana <span className={styles.sample}>· datos de ejemplo</span>
                      </p>
                      <div className={styles.chart}>
                        {WEEK.map((d, i) => (
                          <div key={i} className={styles.barCol}>
                            <span
                              className={`${styles.bar} ${d.top ? styles.barTop : ""}`}
                              style={{ "--h": d.h, "--d": `${i * 0.18}s` } as React.CSSProperties}
                            />
                            <span className={styles.barDay}>{d.day}</span>
                          </div>
                        ))}
                      </div>
                    </Zone>

                    <Zone index={1} active={active}>
                      <p className={styles.zoneTitle}>
                        Agenda de hoy <span className={styles.sample}>· datos de ejemplo</span>
                      </p>
                      <div className={styles.agenda}>
                        <div className={styles.hours}>
                          <span>7:00</span>
                          <span>12:00</span>
                          <span>17:00</span>
                        </div>
                        {AGENDA.map((row, i) => {
                          const chip = CHIPS[(tick + i) % CHIPS.length];
                          return (
                            <div key={row.tech} className={styles.agendaRow}>
                              <span className={styles.agendaName}>
                                [Técnico {row.tech}]
                                <span key={chip.label} className={`${styles.chip} ${styles[chip.tone]}`}>
                                  {chip.label}
                                </span>
                              </span>
                              <span className={styles.track}>
                                {row.blocks.map((b) => (
                                  <span
                                    key={b.start}
                                    className={`${styles.block} ${"suggested" in b ? styles.blockSuggested : ""}`}
                                    style={{ left: `${(b.start / DAY_HOURS) * 100}%`, width: `${(b.len / DAY_HOURS) * 100}%` }}
                                  >
                                    [Cliente]
                                  </span>
                                ))}
                              </span>
                            </div>
                          );
                        })}
                        <p className={styles.legend}>
                          <span />
                          Técnico sugerido por su carga y su especialidad
                        </p>
                      </div>
                    </Zone>

                    <Zone index={2} active={active}>
                      <p className={styles.zoneTitle}>
                        Inventario <span className={styles.sample}>· datos de ejemplo</span>
                      </p>
                      <ul className={styles.stock}>
                        {STOCK.map((m) => (
                          <li key={m.name} className={m.low ? styles.stockLow : undefined}>
                            <span className={styles.stockName}>{m.low ? `${m.name} · quedan pocos` : m.name}</span>
                            <span className={styles.stockTrack}>
                              <span className={styles.stockBar} style={{ "--w": m.n / m.max } as React.CSSProperties} />
                            </span>
                            <span className={styles.stockN}>{m.n}</span>
                          </li>
                        ))}
                      </ul>
                      <p className={styles.movement}>
                        <strong>−2 [Material 1]</strong> · se descontó al cerrar la orden OT-[0000]
                      </p>
                    </Zone>

                    <Zone index={3} active={active}>
                      <div className={styles.detail}>
                        <div className={styles.photos}>
                          <div className={styles.photo}>
                            <span className={styles.flash} />
                            <span className={styles.photoTag}>Antes</span>
                          </div>
                          <div className={styles.photo}>
                            <span className={styles.photoTag}>Después</span>
                          </div>
                          <div className={styles.signature}>
                            <svg width="90" height="36" viewBox="0 0 90 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M4 26c8-14 12-18 14-12s-2 12 4 8 8-16 12-14-2 14 4 12 10-10 14-8 4 8 10 6 10-6 20-8" />
                            </svg>
                          </div>
                        </div>
                        <div className={styles.detailText}>
                          <p className={styles.detailTitle}>OT-[0000] · [Tipo de trabajo]</p>
                          <p>[Cliente] · [Barrio]</p>
                          <dl className={styles.times}>
                            <div>
                              <dt>Asignada</dt>
                              <dd>07:40</dd>
                            </div>
                            <div>
                              <dt>En camino</dt>
                              <dd>08:20</dd>
                            </div>
                            <div>
                              <dt>Inicio</dt>
                              <dd>08:47</dd>
                            </div>
                            <div>
                              <dt>Terminada</dt>
                              <dd>10:12</dd>
                            </div>
                          </dl>
                          <p>Materiales: [Material 1] × 2</p>
                          <p>
                            Técnico: <strong>[Nombre]</strong> · Firmó: <strong>[Nombre del cliente]</strong>
                          </p>
                        </div>
                      </div>
                    </Zone>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.base} />
          </div>

          <div role="tablist" aria-label="Partes del panel" aria-orientation="vertical" className={styles.notes} onKeyDown={onKeyDown}>
            {NOTES.map((n, i) => {
              const on = i === active;
              return (
                <button
                  key={n.tag}
                  ref={(el) => {
                    tabsRef.current[i] = el;
                  }}
                  id={`recorrido-nota-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="recorrido-pantalla"
                  tabIndex={on ? 0 : -1}
                  className={`${styles.note} ${on ? styles.noteOn : ""}`}
                  onClick={() => choose(i)}
                >
                  <span className={styles.noteTag}>{n.tag}</span>
                  <span className={styles.noteTitle}>{n.title}</span>
                  <span className={styles.noteText}>{n.text}</span>
                  {on && running && <span key={`${active}-${inView}`} className={styles.noteProgress} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Zone({ index, active, children }: { index: number; active: number; children: React.ReactNode }) {
  return <div className={`${styles.zone} ${styles[`zone${index + 1}`]} ${index === active ? styles.zoneOn : ""}`}>{children}</div>;
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`${styles.kpi} ${warn ? styles.kpiWarn : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

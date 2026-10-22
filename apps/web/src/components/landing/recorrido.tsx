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
  { tag: "1 · Resumen", title: "Lo de hoy, en una mirada.", text: "Abiertos, terminados y lo que necesita tu atención.", stop: 0 },
  { tag: "2 · Ubicaciones", title: "Dónde se repiten los daños.", text: "Para decidir dónde invertir en mantenimiento.", stop: 250 },
  { tag: "3 · Técnicos", title: "Cómo responde tu equipo.", text: "Terminados y tiempos de cada uno.", stop: 420 },
  { tag: "4 · Detalle", title: "La prueba de cada arreglo.", text: "Foto, responsable y cada hora.", stop: 640 },
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

const PLACES = [
  { name: "Parqueadero", n: 18 },
  { name: "Torre A", n: 14 },
  { name: "Torre B", n: 9 },
  { name: "Piscina", n: 6 },
  { name: "Lobby", n: 5 },
];

const CHIPS = [
  { label: "Disponible", tone: "ok" },
  { label: "En un trabajo", tone: "progress" },
  { label: "Terminó uno", tone: "pending" },
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
          Esto es lo que ves como dueño.
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
                  <p className={styles.sideBrand}>Reportes</p>
                  <ul>
                    {["Resumen", "Ubicaciones", "Técnicos", "Detalle"].map((s, i) => (
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
                        <Kpi label="Abiertos" value="4" />
                        <Kpi label="Terminados" value="12" />
                        <Kpi label="Promedio" value="[h:mm]" />
                        <Kpi label="Atención" value="2" warn />
                      </div>
                      <p className={styles.zoneTitle}>
                        Reportes de la semana <span className={styles.sample}>· datos de ejemplo</span>
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
                        Reportes por ubicación <span className={styles.sample}>· datos de ejemplo</span>
                      </p>
                      <ul className={styles.places}>
                        {PLACES.map((p) => (
                          <li key={p.name}>
                            <span className={styles.placeName}>{p.name}</span>
                            <span className={styles.placeTrack}>
                              <span className={styles.placeBar} style={{ "--w": p.n / PLACES[0].n } as React.CSSProperties} />
                            </span>
                            <span className={styles.placeN}>{p.n}</span>
                          </li>
                        ))}
                      </ul>
                    </Zone>

                    <Zone index={2} active={active}>
                      <p className={styles.zoneTitle}>Técnicos</p>
                      <ul className={styles.techs}>
                        {[1, 2, 3].map((n, i) => {
                          const chip = CHIPS[(tick + i) % CHIPS.length];
                          return (
                            <li key={n} className={styles.tech}>
                              <span className={styles.avatar}>T{n}</span>
                              <strong>[Técnico {n}]</strong>
                              <span key={chip.label} className={`${styles.chip} ${styles[chip.tone]}`}>
                                {chip.label}
                              </span>
                              <span className={styles.techStats}>Terminados [#] · Prom. [h:mm]</span>
                            </li>
                          );
                        })}
                      </ul>
                    </Zone>

                    <Zone index={3} active={active}>
                      <div className={styles.detail}>
                        <div className={styles.photo}>
                          <span className={styles.flash} />
                          <span className={styles.photoTag}>[Foto real]</span>
                        </div>
                        <div className={styles.detailText}>
                          <p className={styles.detailTitle}>Reporte #[0000] · No hay servicio de internet, daño en la fibra</p>
                          <p>Calle 34 #15-04</p>
                          <dl className={styles.times}>
                            <div>
                              <dt>Reportado</dt>
                              <dd>07:58</dd>
                            </div>
                            <div>
                              <dt>Tomado</dt>
                              <dd>08:20</dd>
                            </div>
                            <div>
                              <dt>Iniciado</dt>
                              <dd>08:47</dd>
                            </div>
                            <div>
                              <dt>Terminado</dt>
                              <dd>10:12</dd>
                            </div>
                          </dl>
                          <p>
                            Técnico: <strong>Bocagrande</strong>
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

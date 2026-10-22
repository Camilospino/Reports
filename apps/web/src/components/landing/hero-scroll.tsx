"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion, useScrollProgress } from "@/hooks/use-scroll-progress";
import styles from "./hero-scroll.module.css";

const LAST_PHASE = 10;
const toPhase = (p: number) => Math.min(LAST_PHASE, Math.floor(p * 10.99));
const showHint = (p: number) => p < 0.04;

// Texto de cada tramo de la animación: es texto real, así que el lector de pantalla lo lee completo.
const CAPTIONS = [
  { from: 1, to: 2, text: "Llega el pedido del cliente y se vuelve una orden con dirección y hora." },
  { from: 3, to: 4, text: "El técnico la toma en su celular y marca cada paso, aunque no tenga señal." },
  { from: 5, to: 8, text: "Fotos, firma y materiales llegan solos a tu panel." },
  { from: 9, to: 10, text: "Tú lo ves todo, sin estar ahí.", final: true },
];

const ROWS = [
  { type: "[Tipo de trabajo]", place: "[Cliente]", status: "Completada", tone: "ok", time: "08:00", highlight: true },
  { type: "[Tipo de trabajo]", place: "[Cliente]", status: "En proceso", tone: "progress", time: "09:30" },
  { type: "[Tipo de trabajo]", place: "[Cliente]", status: "En camino", tone: "pending", time: "10:45" },
] as const;

/**
 * Portada: la sección mide varias pantallas de alto y la escena queda fija (sticky) mientras
 * se baja. El progreso del scroll se convierte en una fase (0 a 10) y cada elemento cambia de
 * estado con transiciones de CSS, así que la animación avanza al bajar y retrocede al subir.
 */
export function HeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const scrolled = useScrollProgress(sectionRef, toPhase);
  const hint = useScrollProgress(sectionRef, showHint);
  const phase = reduced ? LAST_PHASE : scrolled;

  // La escena tiene un tamaño fijo de diseño y se escala para caber en cualquier pantalla.
  useEffect(() => {
    const stage = stageRef.current;
    const scene = sceneRef.current;
    if (!stage || !scene) return;
    const fit = () => {
      const s = Math.min(1, stage.clientWidth / scene.offsetWidth, stage.clientHeight / scene.offsetHeight);
      scene.style.setProperty("--s", String(s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const reached = Array.from({ length: phase }, (_, i) => styles[`r${i + 1}`]).filter(Boolean);

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-label="Demostración: cómo un trabajo del técnico llega, con foto y firma, al panel de la empresa"
    >
      <div ref={stageRef} className={[styles.stage, reduced && styles.reduced, ...reached].filter(Boolean).join(" ")}>
        <div className={styles.glow} aria-hidden="true" />

        <div ref={sceneRef} className={styles.scene}>
          {/* Línea que une el celular con el portátil (una para escritorio y otra para celular) */}
          <svg className={`${styles.line} ${styles.lineDesktop}`} viewBox="0 0 1200 800" aria-hidden="true">
            <path d="M336 238 C 372 140, 452 140, 470 236" pathLength={400} />
            <circle cx="470" cy="236" r="5" />
          </svg>
          <svg className={`${styles.line} ${styles.lineMobile}`} viewBox="0 0 400 860" aria-hidden="true">
            <path d="M200 336 C 240 372, 160 392, 200 432" pathLength={400} />
            <circle cx="200" cy="432" r="5" />
          </svg>

          <div className={styles.phone} aria-hidden="true">
            <div className={styles.frame} />
            <div className={styles.screen}>
              <WorkPhoto />
              <div className={styles.photoDim} />
              <div className={styles.scanner}>
                <span />
              </div>
              <div className={styles.island} />
              <p className={styles.photoTag}>[Foto real del trabajo] · 10:12</p>
            </div>
          </div>

          <div className={`${styles.tag} ${styles.tagLoc}`} aria-hidden="true">
            <span className={styles.tagLabel}>Cliente</span>
            <span className={styles.tagValue}>[Nombre del cliente] · [Barrio]</span>
          </div>
          <div className={`${styles.tag} ${styles.tagTech}`} aria-hidden="true">
            <span className={styles.tagLabel}>Técnico</span>
            <span className={styles.tagValue}>[Nombre] · en camino 08:20</span>
          </div>
          <div className={`${styles.tag} ${styles.tagDone}`} aria-hidden="true">
            <CheckIcon />
            <span className={styles.tagValue}>Terminado y firmado · 10:12</span>
          </div>

          <Laptop />

          <div className={styles.intro}>
            <p className={styles.live}>
              <span className={styles.liveDot} aria-hidden="true" />
              Demo en vivo
            </p>
            <h1 className={styles.h1}>
              Cada trabajo de tus técnicos, con foto, hora y firma.
              <span className={styles.h1Accent}>Y tú lo ves todo en tu panel.</span>
            </h1>
          </div>

          <div className={styles.captions}>
            {CAPTIONS.map((c) => (
              <p
                key={c.text}
                className={[styles.caption, c.final && styles.captionFinal, phase >= c.from && phase <= c.to && styles.captionOn]
                  .filter(Boolean)
                  .join(" ")}
              >
                {c.text}
              </p>
            ))}
          </div>
        </div>

        <p className={`${styles.hint} ${hint && !reduced ? styles.hintOn : ""}`} aria-hidden="true">
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.5" />
            <rect className={styles.wheel} x="7" y="5" width="2" height="5" rx="1" fill="currentColor" />
          </svg>
          Haz scroll para ver cómo llega el reporte
        </p>
      </div>
    </section>
  );
}

function Laptop() {
  return (
    <div className={styles.laptop} aria-hidden="true">
      <div className={styles.lid}>
        <div className={styles.panel}>
          <aside className={styles.side}>
            <p className={styles.sideBrand}>Tecnio</p>
            <ul>
              <li className={styles.sideActive}>Resumen</li>
              <li>Agenda</li>
              <li>Órdenes</li>
              <li>Inventario</li>
            </ul>
          </aside>
          <div className={styles.main}>
            <div className={styles.head}>
              <p className={styles.headTitle}>Hoy en [Tu empresa]</p>
              <p className={styles.headLive}>
                <span className={styles.headDot} />
                en vivo
              </p>
            </div>
            <p className={styles.sample}>Datos de ejemplo</p>
            <div className={styles.kpis}>
              <div className={styles.kpi}>
                <span>Hoy</span>
                <strong>14</strong>
              </div>
              <div className={styles.kpi}>
                <span>Completadas</span>
                <strong>9</strong>
              </div>
              <div className={`${styles.kpi} ${styles.kpiWarn}`}>
                <span>Atrasadas</span>
                <strong>1</strong>
              </div>
            </div>
            <ul className={styles.rows}>
              {ROWS.map((r, i) => (
                <li key={r.status} className={[styles.row, styles[`row${i + 1}`], "highlight" in r && styles.rowHighlight].filter(Boolean).join(" ")}>
                  <span className={styles.thumb} />
                  <span className={styles.rowText}>
                    <strong>{r.type}</strong>
                    <span>{r.place} · {r.time}</span>
                  </span>
                  <span className={`${styles.chip} ${styles[r.tone]}`}>{r.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className={styles.base}>
        <span className={styles.notch} />
      </div>
    </div>
  );
}


// Marcador de la foto del trabajo: un equipo instalado en la pared. Se reemplaza por una foto real.
function WorkPhoto() {
  return (
    <svg className={styles.photo} viewBox="0 0 294 614" preserveAspectRatio="xMidYMid slice">
      <rect width="294" height="614" fill="#3F3F46" />
      <g stroke="#52525B" strokeWidth="1">
        <path d="M0 120h294M0 250h294M0 380h294M0 510h294" />
        <path d="M90 0v120M210 120v130M60 250v130M180 380v130M120 510v104" />
      </g>
      <rect x="47" y="190" width="200" height="190" rx="14" fill="#52525B" stroke="#18181B" strokeWidth="3" />
      <circle cx="147" cy="285" r="64" fill="#3F3F46" stroke="#18181B" strokeWidth="3" />
      <g fill="none" stroke="#18181B" strokeWidth="2">
        <circle cx="147" cy="285" r="44" />
        <circle cx="147" cy="285" r="24" />
        <path d="M83 285h128M147 221v128" />
      </g>
      <path d="M147 380v120" stroke="#18181B" strokeWidth="5" strokeLinecap="round" />
      <circle cx="226" cy="208" r="5" fill="#86EFAC" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

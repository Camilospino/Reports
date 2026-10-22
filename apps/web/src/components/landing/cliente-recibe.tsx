"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/use-in-view";
import ui from "./landing.module.css";
import styles from "./cliente-recibe.module.css";

const POINTS = [
  "Fotos del trabajo y firma",
  "Descarga en PDF",
  "Calificación del servicio con estrellas",
  "Tus datos de pago (Nequi o cuenta bancaria)",
];

// El reporte público que la app ya genera (/r/<token>), dibujado dentro de un celular.
export function ClienteRecibe() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);

  return (
    <section ref={ref} aria-labelledby="cliente-titulo" className={`${ui.section} ${ui.light} ${inView ? "" : ui.paused}`}>
      <div className={`${ui.container} ${styles.layout}`}>
        <div className={styles.phoneWrap} aria-hidden="true">
          <div className={styles.phone}>
            <div className={styles.screen}>
              <div className={styles.island} />
              <div className={styles.company}>
                <span className={styles.logo}>TE</span>
                <span>[Tu empresa]</span>
              </div>
              <p className={styles.done}>
                <span className={styles.doneIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                Servicio completado
              </p>
              <p className={styles.meta}>[Tipo de trabajo] · OT-[0000] · hoy 10:12</p>
              <div className={styles.photos}>
                <span>Antes</span>
                <span>Después</span>
              </div>
              <div className={styles.signature}>
                <svg width="110" height="34" viewBox="0 0 90 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 26c8-14 12-18 14-12s-2 12 4 8 8-16 12-14-2 14 4 12 10-10 14-8 4 8 10 6 10-6 20-8" />
                </svg>
                <span>Firmó [Nombre del cliente]</span>
              </div>
              <p className={styles.rateTitle}>¿Cómo te atendimos?</p>
              <div className={styles.stars}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg key={i} style={{ "--i": i } as React.CSSProperties} width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
                  </svg>
                ))}
              </div>
              <div className={styles.buttons}>
                <span className={styles.pdf}>Descargar PDF</span>
                <span className={styles.pay}>Pagar con Nequi</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className={ui.eyebrow}>Lo que recibe tu cliente</p>
          <h2 id="cliente-titulo" className={`${ui.h2} ${styles.title}`}>
            Tu cliente recibe un reporte que da confianza.
          </h2>
          <p className={`${ui.lead} ${styles.lead}`}>
            Al cerrar la orden, le envías por WhatsApp, con un toque, un enlace con las fotos, la firma, lo que se hizo y tus datos de pago.
          </p>
          <ul className={styles.points}>
            {POINTS.map((p) => (
              <li key={p}>
                <span className={styles.check} aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
          <p className={styles.note}>Las cotizaciones también se envían por enlace y se descargan en PDF.</p>
        </div>
      </div>
    </section>
  );
}

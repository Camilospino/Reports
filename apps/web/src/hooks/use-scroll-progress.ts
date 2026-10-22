"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const identity = (p: number) => p;

/**
 * Progreso (0 a 1) del scroll a través de un elemento más alto que la ventana:
 * 0 cuando su borde superior llega arriba y 1 cuando su borde inferior llega abajo.
 *
 * `select` convierte el progreso en lo que el componente necesita (una fase, un booleano):
 * el componente solo se vuelve a pintar cuando ese valor cambia, no en cada píxel de scroll.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): number;
export function useScrollProgress<T>(ref: RefObject<HTMLElement | null>, select: (progress: number) => T): T;
export function useScrollProgress<T>(ref: RefObject<HTMLElement | null>, select: (progress: number) => T = identity as never) {
  const [value, setValue] = useState(() => select(0));
  const selectRef = useRef(select);
  useEffect(() => {
    selectRef.current = select;
  });

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const progress = range > 0 ? clamp(-rect.top / range, 0, 1) : rect.top <= 0 ? 1 : 0;
      const next = selectRef.current(progress);
      setValue((prev) => (Object.is(prev, next) ? prev : next));
    };
    // Un cálculo por cuadro como máximo, aunque el navegador dispare muchos eventos de scroll.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);

  return value;
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** true si el usuario pidió menos movimiento en su sistema. En el servidor siempre es false. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

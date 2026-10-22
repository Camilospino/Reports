"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * true mientras el elemento está (o casi está) en pantalla. Sirve para pausar animaciones
 * en bucle que nadie está viendo y para arrancar las que dependen de que la sección se vea.
 */
export function useInView(ref: RefObject<Element | null>, rootMargin = "100px") {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return inView;
}

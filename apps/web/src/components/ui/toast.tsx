"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Tone = "error" | "ok";
type Item = { id: number; message: string; tone: Tone };

const EVENT = "tecnio:toast";
const DURATION_MS = 6000;

// Avisos flotantes. Se llaman desde cualquier componente de cliente: toast("No se pudo guardar").
export function toast(message: string, tone: Tone = "error") {
  window.dispatchEvent(new CustomEvent<Omit<Item, "id">>(EVENT, { detail: { message, tone } }));
}

// Va una sola vez en el layout del panel. Las regiones vivas existen desde el inicio para que el
// lector de pantalla anuncie los avisos que llegan después.
export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let next = 0;
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent<Omit<Item, "id">>).detail;
      const id = ++next;
      setItems((list) => [...list.slice(-2), { id, message, tone }]);
      // Popover: lo vuelve a abrir para quedar encima de un diálogo abierto (capa superior).
      const el = layer.current;
      if (el?.showPopover) {
        if (el.matches(":popover-open")) el.hidePopover();
        el.showPopover();
      }
      setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), DURATION_MS);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  const close = (id: number) => setItems((list) => list.filter((i) => i.id !== id));
  const render = (tone: Tone) =>
    items
      .filter((i) => i.tone === tone)
      .map((i) => (
        <div
          key={i.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-[12px] px-4 py-3 text-sm shadow-lg ${
            i.tone === "error" ? "bg-[#9B1C1C] text-white" : "bg-ink text-white"
          }`}
        >
          <p className="flex-1">{i.message}</p>
          <button type="button" aria-label="Cerrar aviso" className="-m-1 cursor-pointer p-1 opacity-80 hover:opacity-100" onClick={() => close(i.id)}>
            <X size={16} aria-hidden />
          </button>
        </div>
      ));

  return (
    <div
      ref={layer}
      popover="manual"
      className="pointer-events-none fixed inset-auto right-4 bottom-4 left-4 z-50 m-0 flex flex-col items-end gap-2 overflow-visible border-0 bg-transparent p-0 sm:left-auto sm:w-[380px]"
    >
      <div role="alert" className="flex w-full flex-col gap-2">
        {render("error")}
      </div>
      <div role="status" className="flex w-full flex-col gap-2">
        {render("ok")}
      </div>
    </div>
  );
}

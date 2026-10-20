"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, Truck } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { whatsappLink } from "@/lib/format";
import { logNotice } from "./actions";

type Sent = { id: string; text: string; meta: string };

// Avisos al cliente: abre WhatsApp con el mensaje listo y lo deja en el historial.
export function Notices({
  orderId,
  phone,
  sent,
  onTheWay,
  report,
}: {
  orderId: string;
  phone: string | null;
  sent: Sent[];
  onTheWay: string;
  report: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const send = (kind: "en_camino" | "reporte", text: string) => {
    // Se abre en el clic (si no, el navegador bloquea la ventana) y luego se registra.
    window.open(whatsappLink(phone!, text), "_blank", "noopener,noreferrer");
    start(async () => {
      setError(null);
      const r = await logNotice(orderId, kind);
      if (r.error) setError(r.error);
      router.refresh();
    });
  };

  return (
    <SectionCard title="Avisos al cliente">
      {sent.length === 0 ? (
        <p className="text-sm text-muted">Aún no le has enviado mensajes al cliente.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sent.map((m) => (
            <li key={m.id}>
              <p className="rounded-[12px_12px_12px_4px] bg-primary-soft px-3.5 py-2.5 text-sm break-words">{m.text}</p>
              <p className="mt-1 text-xs text-muted">{m.meta}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {!phone && <p className="text-[13px] text-muted">El cliente no tiene WhatsApp registrado.</p>}
        <button type="button" className="btn-outline w-full" disabled={!phone} onClick={() => send("en_camino", onTheWay)}>
          <Truck size={16} aria-hidden /> Avisar que va en camino
        </button>
        <button
          type="button"
          className="btn-outline w-full"
          disabled={!phone || !report}
          title={report ? undefined : "Disponible cuando la orden esté completada"}
          onClick={() => report && send("reporte", report)}
        >
          <FileCheck2 size={16} aria-hidden /> Enviar reporte
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#9B1C1C]">
          {error}
        </p>
      )}
    </SectionCard>
  );
}

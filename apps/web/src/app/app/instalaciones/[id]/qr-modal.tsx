"use client";

import { useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode, X } from "lucide-react";

type Label = { id: string; name: string };

// Un QR por equipo que apunta a /e/[id]. Los códigos se dibujan al abrir el modal.
export function QrButton({ installationId, baseUrl, labels }: { installationId: string; baseUrl: string; labels: Label[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [svgs, setSvgs] = useState<Record<string, string> | null>(null);

  const open = async () => {
    ref.current?.showModal();
    if (svgs) return;
    const list = await Promise.all(
      labels.map(async (l) => [l.id, await QRCode.toString(`${baseUrl}/e/${l.id}`, { type: "svg", margin: 1 })] as const),
    );
    setSvgs(Object.fromEntries(list));
  };

  return (
    <>
      <button type="button" className="btn-outline" onClick={open}>
        <QrCode size={18} aria-hidden />
        Generar QR
      </button>
      <dialog
        ref={ref}
        aria-labelledby="qr-titulo"
        className="m-auto max-h-[calc(100dvh-32px)] w-[min(720px,calc(100vw-32px))] rounded-[14px] border border-line bg-surface p-0 text-ink backdrop:bg-ink/40"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id="qr-titulo" className="font-display text-lg font-bold">
            Códigos QR de los equipos
          </h2>
          <button type="button" aria-label="Cerrar" className="btn w-11 px-0 hover:bg-bg" onClick={() => ref.current?.close()}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto p-5">
          {!labels.length ? (
            <p className="text-sm text-muted">Agrega equipos para generar sus códigos.</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">Al escanearlo, el técnico llega directo a esta instalación.</p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-busy={!svgs}>
                {labels.map((l) => (
                  <li key={l.id} className="rounded-[10px] border border-line-soft p-3 text-center">
                    {svgs?.[l.id] ? (
                      <div role="img" aria-label={`Código QR de ${l.name}`} className="mx-auto w-full max-w-[120px]" dangerouslySetInnerHTML={{ __html: svgs[l.id]! }} />
                    ) : (
                      <div aria-hidden className="mx-auto aspect-square w-full max-w-[120px] animate-pulse rounded-[8px] bg-line-soft motion-reduce:animate-none" />
                    )}
                    <p className="mt-2 truncate text-[13px] font-semibold">{l.name}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2.5 border-t border-line px-5 py-4">
          <button type="button" className="btn-outline" onClick={() => ref.current?.close()}>
            Cerrar
          </button>
          {!!labels.length && (
            <a href={`/app/instalaciones/${installationId}/qr`} download className="btn-primary">
              <Download size={18} aria-hidden />
              Descargar PDF para imprimir
            </a>
          )}
        </div>
      </dialog>
    </>
  );
}

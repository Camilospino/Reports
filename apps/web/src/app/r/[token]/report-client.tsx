"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Download, MessageCircle, PenLine, Star, X } from "lucide-react";
import { cop, formatPhone, whatsappLink } from "@/lib/format";
import type { ReportPayment } from "@/lib/report";
import { commentReport, rateReport } from "./actions";

// ---------------------------------------------------------------------------
// Antes y después: 3 miniaturas; la tercera dice "+N" si hay más. Clic abre la galería.
// ---------------------------------------------------------------------------
type Photo = { id: string; kind: "foto_antes" | "foto_despues"; caption: string; url: string };

export function Gallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);
  // Si hay de las dos, la primera de antes y la primera de después van adelante.
  const firstAfter = photos.findIndex((p) => p.kind === "foto_despues");
  const order =
    firstAfter > 0 ? [0, firstAfter, ...photos.map((_, i) => i).filter((i) => i !== 0 && i !== firstAfter)] : photos.map((_, i) => i);
  const thumbs = order.slice(0, 3);
  const more = photos.length - 3;

  return (
    <>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {thumbs.map((i, n) => {
          const p = photos[i]!;
          const overlay = n === 2 && more > 0;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="relative block aspect-square w-full overflow-hidden rounded-[10px] bg-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- la sirve /r/[token]/foto con el token */}
                <img src={p.url} alt="" loading="lazy" className="size-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {p.kind === "foto_antes" ? "Antes" : "Después"}
                </span>
                {overlay && (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/60 font-display text-2xl font-bold text-white">
                    +{more}
                  </span>
                )}
                <span className="sr-only">{overlay ? `: ver las ${photos.length} fotos` : `: ver foto, ${p.caption}`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: Photo[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const photo = photos[index]!;
  const go = useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, onIndex, photos.length]);

  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={`Foto ${index + 1} de ${photos.length}: ${photo.caption}`}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-white"
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        if (start != null && end != null && Math.abs(end - start) > 50) go(end < start ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="mx-auto flex h-full max-w-[960px] flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
          <span>
            {index + 1} de {photos.length}
          </span>
          <button type="button" aria-label="Cerrar" autoFocus className="btn w-11 bg-white/10 px-0 text-white hover:bg-white/20" onClick={() => ref.current?.close()}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <figure className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- la sirve /r/[token]/foto con el token */}
          <img src={photo.url} alt={photo.caption} className="max-h-full min-h-0 w-auto rounded-[10px] object-contain" />
          <figcaption className="text-sm">{photo.caption}</figcaption>
        </figure>
        {photos.length > 1 && (
          <div className="flex justify-center gap-3 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            <button type="button" aria-label="Foto anterior" className="btn w-12 bg-white/10 px-0 text-white hover:bg-white/20" onClick={() => go(-1)}>
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button type="button" aria-label="Foto siguiente" className="btn w-12 bg-white/10 px-0 text-white hover:bg-white/20" onClick={() => go(1)}>
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

// ---------------------------------------------------------------------------
// ¿Cómo te atendimos? Una sola calificación por orden; después, comentario opcional.
// ---------------------------------------------------------------------------
type RatingState = { stars: number; comment: string | null; can_comment: boolean } | null;

export function Rating({ token, initial }: { token: string; initial: RatingState }) {
  const [rating, setRating] = useState<RatingState>(initial);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [justRated, setJustRated] = useState(false);

  const rate = (n: number) => {
    if (rating || pending) return;
    setError(null);
    setRating({ stars: n, comment: null, can_comment: true });
    start(async () => {
      const res = await rateReport(token, n);
      if (res.error) {
        setRating(null);
        setError(res.error);
      } else {
        setRating({ stars: res.stars!, comment: null, can_comment: res.stars === n });
        setJustRated(true);
      }
    });
  };

  const shown = rating?.stars ?? hover;
  return (
    <div className="mt-2">
      <div
        role="group"
        aria-label={rating ? `Calificaste ${rating.stars} de 5` : "Califica el servicio"}
        className="flex justify-center gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} de 5`}
            aria-pressed={rating ? n <= rating.stars : undefined}
            disabled={Boolean(rating) || pending}
            onClick={() => rate(n)}
            onMouseEnter={() => !rating && setHover(n)}
            onFocus={() => !rating && setHover(n)}
            onBlur={() => setHover(0)}
            className="inline-flex size-12 items-center justify-center rounded-[10px] text-accent transition-transform focus-visible:outline-2 focus-visible:outline-primary enabled:cursor-pointer enabled:active:scale-90 disabled:cursor-default"
          >
            <Star size={32} aria-hidden fill={n <= shown ? "currentColor" : "none"} className={n <= shown ? "" : "text-line"} strokeWidth={1.75} />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-1 text-center text-sm text-muted">
        {error ? (
          <span className="text-[#9B1C1C]">{error}</span>
        ) : rating ? (
          justRated ? "¡Gracias por calificarnos!" : "Ya calificaste este servicio. ¡Gracias!"
        ) : (
          "Toca las estrellas para calificar"
        )}
      </p>
      {rating && <Comment token={token} rating={rating} />}
    </div>
  );
}

function Comment({ token, rating }: { token: string; rating: NonNullable<RatingState> }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<string | null>(rating.comment);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (saved) {
    return <p className="mt-3 rounded-[10px] bg-bg p-3 text-sm whitespace-pre-line">“{saved}”</p>;
  }
  if (!rating.can_comment) return null;

  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await commentReport(token, text);
          if (res.error) setError(res.error);
          else setSaved(text.trim());
        });
      }}
    >
      <label htmlFor="comentario" className="label">
        Cuéntanos más <span className="font-normal text-muted">(opcional)</span>
      </label>
      <textarea
        id="comentario"
        rows={3}
        maxLength={500}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="¿Qué te gustó? ¿Qué podemos mejorar?"
        className="textarea"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-[#9B1C1C]">
          {error}
        </p>
      )}
      <button className="btn-outline mt-2 w-full" disabled={pending || !text.trim()}>
        {pending ? "Enviando…" : "Enviar comentario"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Pie fijo: Pagar (datos de pago de la empresa), Descargar PDF y Ver firma.
// ---------------------------------------------------------------------------
type FooterProps = {
  token: string;
  total: number;
  orderLabel: string;
  company: { name: string; phone: string | null };
  payment: ReportPayment | null;
  signature: { url: string; signer: string | null; at: string } | null;
};

export function ReportFooter({ token, total, orderLabel, company, payment, signature }: FooterProps) {
  const [sheet, setSheet] = useState<"pago" | "firma" | null>(null);
  return (
    <>
      <div className="report-footer fixed inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-[480px] border-t border-line bg-surface px-5 pt-3 pb-[max(10px,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(16,33,28,0.06)]">
          {total > 0 && (
            <button type="button" className="btn-dark font-display tabular h-[54px] w-full text-base" onClick={() => setSheet("pago")}>
              {`Pagar ${cop(total)}`}
            </button>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a href={`/r/${token}/pdf`} className="btn-outline">
              <Download size={16} aria-hidden /> Descargar PDF
            </a>
            <button type="button" className="btn-outline" disabled={!signature} onClick={() => setSheet("firma")}>
              <PenLine size={16} aria-hidden /> Ver firma
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">Enviado con tecnio</p>
        </div>
      </div>

      {sheet === "pago" && (
        <Sheet title={`Pagar ${cop(total)}`} onClose={() => setSheet(null)}>
          <PaymentInfo total={total} orderLabel={orderLabel} company={company} payment={payment} />
        </Sheet>
      )}
      {sheet === "firma" && signature && (
        <Sheet title="Firma de recibido" onClose={() => setSheet(null)}>
          <div className="rounded-[14px] border border-line bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- la sirve /r/[token]/foto con el token */}
            <img src={signature.url} alt={`Firma de ${signature.signer ?? "quien recibió"}`} className="mx-auto max-h-48 w-full object-contain" />
          </div>
          <p className="mt-3 text-sm">
            Recibió: <span className="font-semibold">{signature.signer ?? "—"}</span>
          </p>
          <p className="text-sm text-muted">{signature.at}</p>
        </Sheet>
      )}
    </>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="sheet-title"
      className="mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-[480px] rounded-t-[20px] bg-surface p-0 text-ink backdrop:bg-ink/50"
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <div className="px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="sheet-title" className="font-display text-lg font-bold">
            {title}
          </h2>
          <button type="button" aria-label="Cerrar" className="btn w-11 px-0 hover:bg-bg" onClick={() => ref.current?.close()}>
            <X size={20} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function PaymentInfo({
  total,
  orderLabel,
  company,
  payment,
}: Pick<FooterProps, "total" | "orderLabel" | "company" | "payment">) {
  const proof = company.phone
    ? whatsappLink(company.phone, `Hola, pagué la orden ${orderLabel} por ${cop(total)}. Te envío el comprobante.`)
    : null;

  return (
    <div className="space-y-3 text-sm">
      {!payment && (
        <p className="rounded-[10px] bg-bg p-3">
          {company.name} todavía no ha publicado sus datos de pago. Escríbeles para coordinar el pago de la orden {orderLabel}.
        </p>
      )}
      {payment?.nequi && (
        <div className="rounded-[14px] border border-line p-4">
          <p className="text-xs font-semibold tracking-[0.04em] text-muted uppercase">Nequi</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="font-display tabular text-lg font-bold">{formatPhone(payment.nequi)}</p>
            <CopyButton value={payment.nequi} label="Copiar número de Nequi" />
          </div>
        </div>
      )}
      {payment?.account_number && (
        <div className="rounded-[14px] border border-line p-4">
          <p className="text-xs font-semibold tracking-[0.04em] text-muted uppercase">Transferencia</p>
          <p className="mt-1 font-semibold">
            {[payment.bank, payment.account_type && `Cuenta de ${payment.account_type}`].filter(Boolean).join(" · ")}
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="font-display tabular text-lg font-bold">{payment.account_number}</p>
            <CopyButton value={payment.account_number.replace(/\D/g, "")} label="Copiar número de cuenta" />
          </div>
          {(payment.holder || payment.holder_id) && (
            <p className="text-muted">A nombre de {[payment.holder, payment.holder_id].filter(Boolean).join(" · ")}</p>
          )}
        </div>
      )}
      {payment?.notes && <p className="text-muted">{payment.notes}</p>}
      {proof && (
        <a href={proof} target="_blank" rel="noopener noreferrer" className="btn-primary h-12 w-full">
          <MessageCircle size={18} aria-hidden /> {payment ? "Enviar comprobante por WhatsApp" : `Escribir a ${company.name}`}
        </a>
      )}
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Copiado" : label}
      className="btn-outline h-10 px-3"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // sin permiso para el portapapeles: el número igual está a la vista
        }
      }}
    >
      {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, X } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { createClient } from "@/lib/supabase/client";
import { addPhoto, deletePhoto } from "./actions";

export type Photo = { id: string; url: string | null; caption: string; kind: "foto_antes" | "foto_despues" };

const MAX_MB = 10;

export function Photos({ orderId, companyId, photos }: { orderId: string; companyId: string; photos: Photo[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const upload = useRef<HTMLDialogElement>(null);

  return (
    <SectionCard
      title="Evidencia fotográfica"
      action={
        <button type="button" className="link inline-flex items-center gap-1.5 text-sm" onClick={() => upload.current?.showModal()}>
          <ImagePlus size={16} aria-hidden /> Subir foto
        </button>
      }
    >
      {photos.length === 0 ? (
        <p className="text-sm text-muted">Aún no hay fotos. El técnico las sube desde la app, o puedes subirlas aquí.</p>
      ) : (
        <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="block w-full cursor-zoom-in overflow-hidden rounded-[10px] border border-line-soft bg-bg focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`Ver foto: ${p.caption}`}
              >
                {p.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Storage
                  <img src={p.url} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <span className="flex aspect-[4/3] items-center justify-center text-xs text-muted">No disponible</span>
                )}
              </button>
              <p className="mt-1.5 truncate text-xs text-muted">{p.caption}</p>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-[#9B1C1C]">
          {error}
        </p>
      )}

      {open != null && (
        <Lightbox
          photos={photos}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          onDelete={(p) => {
            if (!confirm("¿Quitar esta foto de la orden?")) return;
            start(async () => {
              const r = await deletePhoto(orderId, p.id);
              if (r.error) setError(r.error);
              setOpen(null);
              router.refresh();
            });
          }}
          deleting={pending}
        />
      )}

      <dialog
        ref={upload}
        aria-labelledby="subir-foto"
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[14px] border border-line bg-surface p-0 text-ink backdrop:bg-ink/40"
      >
        <form
          className="grid gap-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            const file = fd.get("file");
            if (!(file instanceof File) || !file.size) return setError("Escoge una foto.");
            if (!file.type.startsWith("image/")) return setError("El archivo debe ser una imagen.");
            if (file.size > MAX_MB * 1024 * 1024) return setError(`La foto pesa más de ${MAX_MB} MB.`);
            start(async () => {
              setError(null);
              const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
              const storagePath = `${companyId}/${orderId}/${crypto.randomUUID()}.${ext}`;
              const { error: upErr } = await createClient().storage.from("evidencias").upload(storagePath, file, { contentType: file.type });
              if (upErr) return setError("No se pudo subir la foto. Intenta de nuevo.");
              const r = await addPhoto(orderId, {
                storagePath,
                kind: fd.get("kind") === "foto_antes" ? "foto_antes" : "foto_despues",
                caption: String(fd.get("caption") ?? ""),
              });
              if (r.error) return setError(r.error);
              form.reset();
              upload.current?.close();
              router.refresh();
            });
          }}
        >
          <div className="flex items-center justify-between">
            <h2 id="subir-foto" className="font-display text-lg font-bold">
              Subir foto
            </h2>
            <button type="button" aria-label="Cerrar" className="cursor-pointer" onClick={() => upload.current?.close()}>
              <X size={18} aria-hidden />
            </button>
          </div>
          <div>
            <label className="label" htmlFor="f-file">
              Foto
            </label>
            <input id="f-file" name="file" type="file" accept="image/*" className="text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="f-kind">
                Momento
              </label>
              <select id="f-kind" name="kind" className="input" defaultValue="foto_despues">
                <option value="foto_antes">Antes</option>
                <option value="foto_despues">Después</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="f-caption">
                Pie de foto
              </label>
              <input id="f-caption" name="caption" maxLength={120} placeholder="Cámara 3 instalada" className="input" />
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-[#9B1C1C]">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2.5">
            <button type="button" className="btn-outline" onClick={() => upload.current?.close()}>
              Cancelar
            </button>
            <button className="btn-primary" disabled={pending}>
              {pending ? "Subiendo…" : "Subir"}
            </button>
          </div>
        </form>
      </dialog>
    </SectionCard>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
  onDelete,
  deleting,
}: {
  photos: Photo[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onDelete: (p: Photo) => void;
  deleting: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
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
      className="m-auto max-h-[calc(100vh-32px)] w-[min(1000px,calc(100vw-32px))] bg-transparent p-0 backdrop:bg-ink/85"
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <figure className="flex flex-col items-center gap-3">
        {photo.url && (
          // eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Storage
          <img src={photo.url} alt={photo.caption} className="max-h-[calc(100vh-140px)] w-auto rounded-[10px] object-contain" />
        )}
        <figcaption className="flex w-full flex-wrap items-center justify-between gap-3 text-sm text-white">
          <span>
            {photo.caption} · {index + 1} de {photos.length}
          </span>
          <span className="flex gap-2">
            {photos.length > 1 && (
              <>
                <button type="button" aria-label="Foto anterior" className="btn w-11 bg-white/10 px-0 text-white hover:bg-white/20" onClick={() => go(-1)}>
                  <ChevronLeft size={18} aria-hidden />
                </button>
                <button type="button" aria-label="Foto siguiente" className="btn w-11 bg-white/10 px-0 text-white hover:bg-white/20" onClick={() => go(1)}>
                  <ChevronRight size={18} aria-hidden />
                </button>
              </>
            )}
            <button type="button" aria-label="Quitar foto" disabled={deleting} className="btn w-11 bg-white/10 px-0 text-white hover:bg-white/20" onClick={() => onDelete(photo)}>
              <Trash2 size={18} aria-hidden />
            </button>
            <button type="button" aria-label="Cerrar" autoFocus className="btn w-11 bg-white/10 px-0 text-white hover:bg-white/20" onClick={() => ref.current?.close()}>
              <X size={18} aria-hidden />
            </button>
          </span>
        </figcaption>
      </figure>
    </dialog>
  );
}

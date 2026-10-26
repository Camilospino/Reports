"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, X } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { toast } from "@/components/ui/toast";
import { addInstallationFile, deleteInstallationFile } from "./actions";
import { uploadInstallationImage } from "./upload";

export type SiteFile = { id: string; kind: "plano" | "foto"; url: string };

export function FilesCard({ installationId, companyId, files }: { installationId: string; companyId: string; files: SiteFile[] }) {
  const router = useRouter();
  const upload = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<SiteFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const plan = files.find((f) => f.kind === "plano");
  const photos = files.filter((f) => f.kind === "foto");
  const label = (f: SiteFile) => (f.kind === "plano" ? "Plano de la instalación" : `Foto del sitio ${photos.indexOf(f) + 1}`);

  return (
    <SectionCard
      title="Fotos y plano"
      action={
        <button type="button" className="link inline-flex cursor-pointer items-center gap-1.5 text-sm" onClick={() => upload.current?.showModal()}>
          <ImagePlus size={16} aria-hidden /> Subir
        </button>
      }
    >
      {plan || photos.length ? (
        <div className="space-y-3">
          {plan && <Thumb file={plan} label={label(plan)} onOpen={setOpen} className="w-full" />}
          {!!photos.length && (
            <ul className="grid grid-cols-2 gap-3">
              {photos.map((p) => (
                <li key={p.id}>
                  <Thumb file={p} label={label(p)} onOpen={setOpen} className="aspect-[4/3] w-full" />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => upload.current?.showModal()}
          className="block w-full cursor-pointer rounded-[10px] border-2 border-dashed border-line px-4 py-8 text-center text-sm text-muted hover:border-primary hover:text-primary"
        >
          Sube el plano o fotos del sitio
        </button>
      )}

      {open && (
        <Lightbox
          file={open}
          label={label(open)}
          deleting={pending}
          onClose={() => setOpen(null)}
          onDelete={() => {
            if (!confirm("¿Quitar esta imagen de la instalación?")) return;
            start(async () => {
              const r = await deleteInstallationFile(installationId, open.id).catch(() => ({ error: "No hay conexión. Intenta de nuevo." }));
              if (r.error) return toast(r.error);
              setOpen(null);
              router.refresh();
            });
          }}
        />
      )}

      <dialog
        ref={upload}
        aria-labelledby="subir-archivo"
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[14px] border border-line bg-surface p-0 text-ink backdrop:bg-ink/40"
      >
        <form
          className="grid gap-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            const file = fd.get("file");
            const kind = fd.get("kind") === "plano" ? "plano" : "foto";
            if (!(file instanceof File) || !file.size) return setError("Escoge una imagen.");
            setError(null);
            start(async () => {
              const up = await uploadInstallationImage(companyId, installationId, file, "sitio");
              if ("error" in up) {
                setError(up.error);
                return toast(up.error);
              }
              const r = await addInstallationFile(installationId, kind, up.path).catch(() => ({
                error: "No hay conexión. Intenta de nuevo.",
              }));
              if (r.error) {
                setError(r.error);
                return toast(r.error);
              }
              form.reset();
              upload.current?.close();
              toast(kind === "plano" ? "Plano guardado." : "Foto guardada.", "ok");
              router.refresh();
            });
          }}
        >
          <div className="flex items-center justify-between">
            <h2 id="subir-archivo" className="font-display text-lg font-bold">
              Subir plano o foto
            </h2>
            <button type="button" aria-label="Cerrar" className="btn w-11 px-0 hover:bg-bg" onClick={() => upload.current?.close()}>
              <X size={18} aria-hidden />
            </button>
          </div>
          <fieldset>
            <legend className="label">¿Qué vas a subir?</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="kind" value="foto" defaultChecked /> Foto del sitio
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="kind" value="plano" /> Plano {plan && <span className="text-muted">(reemplaza el actual)</span>}
              </label>
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="sitio-file">
              Imagen
            </label>
            <input id="sitio-file" name="file" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" required />
            <p className="mt-1 text-xs text-muted">JPG, PNG o WebP, hasta 10 MB.</p>
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

function Thumb({ file, label, onOpen, className }: { file: SiteFile; label: string; onOpen: (f: SiteFile) => void; className: string }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(file)}
      aria-label={`Ver en grande: ${label}`}
      className="block w-full cursor-zoom-in overflow-hidden rounded-[10px] border border-line-soft bg-bg"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Storage */}
      <img src={file.url} alt="" className={`${className} object-cover`} />
    </button>
  );
}

function Lightbox({
  file,
  label,
  deleting,
  onClose,
  onDelete,
}: {
  file: SiteFile;
  label: string;
  deleting: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={label}
      className="m-auto max-h-[calc(100vh-32px)] w-[min(1100px,calc(100vw-32px))] bg-transparent p-0 backdrop:bg-ink/85"
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <figure className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada y temporal de Storage */}
        <img src={file.url} alt={label} className="max-h-[calc(100vh-140px)] w-auto rounded-[10px] bg-white object-contain" />
        <figcaption className="flex w-full flex-wrap items-center justify-between gap-3 text-sm text-white">
          <span>{label}</span>
          <span className="flex gap-2">
            <button type="button" aria-label="Quitar imagen" disabled={deleting} className="btn w-11 bg-white/10 px-0 text-white hover:bg-white/20" onClick={onDelete}>
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

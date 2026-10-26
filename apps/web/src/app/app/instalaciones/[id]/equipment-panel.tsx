"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { ASSET_STATUS, type AssetStatus } from "@/lib/installations";
import { saveAsset } from "./actions";
import { uploadInstallationImage } from "./upload";
import type { EquipmentRow } from "./equipment-table";

// Panel lateral para editar o agregar un equipo. Si falla el guardado, el panel sigue abierto
// con lo que se escribió.
export function EquipmentPanel({
  installationId,
  companyId,
  asset,
  categories,
  onClose,
}: {
  installationId: string;
  companyId: string;
  asset: EquipmentRow | null; // null = equipo nuevo
  categories: string[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(asset?.photo_url ?? null);
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);
  // La vista previa de un archivo local se libera al cambiarla o al cerrar.
  useEffect(() => () => void (preview?.startsWith("blob:") && URL.revokeObjectURL(preview)), [preview]);

  const title = asset ? `Editar ${asset.name ?? asset.type}` : "Agregar equipo";

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("photo");
    const text = (k: string) => String(fd.get(k) ?? "");
    setError(null);
    start(async () => {
      let photo_path: string | undefined = removePhoto ? "" : undefined;
      if (file instanceof File && file.size) {
        const up = await uploadInstallationImage(companyId, installationId, file, "equipos");
        if ("error" in up) {
          setError(up.error);
          toast(up.error);
          return;
        }
        photo_path = up.path;
      }
      const res = await saveAsset(installationId, asset?.id ?? null, {
        name: text("name"),
        type: text("type"),
        category: text("category"),
        brand: text("brand"),
        model: text("model"),
        serial: text("serial"),
        location: text("location"),
        status: text("status") as AssetStatus,
        photo_path,
      }).catch(() => ({ error: "No hay conexión. Tus cambios siguen en el formulario; intenta de nuevo." }));
      if (res.error) {
        setError(res.error);
        toast(res.error);
        return;
      }
      toast(asset ? "Equipo guardado." : "Equipo agregado.", "ok");
      router.refresh();
      ref.current?.close();
    });
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="equipo-titulo"
      className="ml-auto mr-0 h-dvh max-h-dvh w-[min(440px,100vw)] max-w-none border-0 border-l border-line bg-surface p-0 text-ink backdrop:bg-ink/40"
    >
      <form onSubmit={submit} className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id="equipo-titulo" className="font-display text-lg font-bold">
            {title}
          </h2>
          <button type="button" aria-label="Cerrar" className="btn w-11 px-0 hover:bg-bg" onClick={() => ref.current?.close()}>
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="grid flex-1 content-start gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          <Field id="eq-name" label="Nombre" className="sm:col-span-2">
            <input id="eq-name" name="name" defaultValue={asset?.name ?? ""} placeholder="Cámara 6" maxLength={80} className="input" required />
          </Field>
          <Field id="eq-type" label="Tipo">
            <input id="eq-type" name="type" defaultValue={asset?.type ?? ""} placeholder="Bala 4 MP" maxLength={60} className="input" required />
          </Field>
          <Field id="eq-category" label="Grupo">
            <input
              id="eq-category"
              name="category"
              list="eq-categories"
              defaultValue={asset?.category ?? categories[0] ?? "Otros"}
              maxLength={40}
              className="input"
              required
            />
            <datalist id="eq-categories">
              {[...new Set([...categories, "Cámaras", "Otros"])].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field id="eq-brand" label="Marca">
            <input id="eq-brand" name="brand" defaultValue={asset?.brand ?? ""} placeholder="Hikvision" maxLength={60} className="input" />
          </Field>
          <Field id="eq-model" label="Modelo">
            <input id="eq-model" name="model" defaultValue={asset?.model ?? ""} maxLength={60} className="input" />
          </Field>
          <Field id="eq-serial" label="Serial">
            <input id="eq-serial" name="serial" defaultValue={asset?.serial ?? ""} maxLength={60} className="input font-mono" />
          </Field>
          <Field id="eq-location" label="Ubicación">
            <input id="eq-location" name="location" defaultValue={asset?.location ?? ""} placeholder="Parqueadero" maxLength={80} className="input" />
          </Field>
          <Field id="eq-status" label="Estado" className="sm:col-span-2">
            <select id="eq-status" name="status" defaultValue={asset?.status ?? "funcionando"} className="input">
              {Object.entries(ASSET_STATUS).map(([v, s]) => (
                <option key={v} value={v}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="eq-photo">
              Foto <span className="font-normal text-muted">(opcional)</span>
            </label>
            {preview && !removePhoto && (
              <div className="mb-2 flex items-end gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL firmada o archivo local */}
                <img src={preview} alt="Foto del equipo" className="h-28 w-40 rounded-[10px] border border-line object-cover" />
                <button
                  type="button"
                  className="link text-sm"
                  onClick={() => {
                    setRemovePhoto(true);
                    setPreview(null);
                    if (fileInput.current) fileInput.current.value = "";
                  }}
                >
                  Quitar foto
                </button>
              </div>
            )}
            <input
              ref={fileInput}
              id="eq-photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setRemovePhoto(false);
                setPreview(f ? URL.createObjectURL(f) : (asset?.photo_url ?? null));
              }}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-[#9B1C1C] sm:col-span-2">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2.5 border-t border-line px-5 py-4">
          <button type="button" className="btn-outline" onClick={() => ref.current?.close()}>
            Cancelar
          </button>
          <button className="btn-primary" disabled={pending}>
            {pending ? "Guardando…" : asset ? "Guardar cambios" : "Agregar equipo"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function Field({ id, label, className = "", children }: { id: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

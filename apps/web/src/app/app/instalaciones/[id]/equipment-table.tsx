"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ToneChip } from "@/components/ui/tone-chip";
import { ASSET_STATUS, type AssetStatus } from "@/lib/installations";
import { EquipmentPanel } from "./equipment-panel";

export type EquipmentRow = {
  id: string;
  name: string | null;
  type: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial: string | null;
  location: string | null;
  status: AssetStatus;
  photo_url: string | null;
};

const FAILING = "__falla";

// Filtros: Todos, un grupo por cada categoría que exista y "Con falla".
export function EquipmentTable({
  installationId,
  companyId,
  assets,
}: {
  installationId: string;
  companyId: string;
  assets: EquipmentRow[];
}) {
  const [filter, setFilter] = useState<string | null>(null);
  // undefined = panel cerrado; null = equipo nuevo.
  const [editing, setEditing] = useState<EquipmentRow | null | undefined>(undefined);

  const categories = [...new Set(assets.map((a) => a.category))];
  const failing = assets.filter((a) => a.status === "con_falla").length;
  const visible = assets.filter((a) =>
    filter === null ? true : filter === FAILING ? a.status === "con_falla" : a.category === filter,
  );

  const pills = [
    { key: null, label: "Todos" },
    ...categories.map((c) => ({ key: c, label: c })),
    { key: FAILING, label: `Con falla (${failing})` },
  ];

  const panel = editing !== undefined && (
    <EquipmentPanel
      key={editing?.id ?? "nuevo"}
      installationId={installationId}
      companyId={companyId}
      asset={editing}
      categories={categories}
      onClose={() => setEditing(undefined)}
    />
  );

  if (!assets.length)
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted">Aún no hay equipos registrados.</p>
        <button type="button" className="btn-outline mt-4" onClick={() => setEditing(null)}>
          <Plus size={18} aria-hidden />
          Agregar equipo
        </button>
        {panel}
      </div>
    );

  return (
    <>
      <div role="group" aria-label="Filtrar equipos" className="mb-4 flex flex-wrap gap-2">
        {pills.map((p) => {
          const active = filter === p.key;
          return (
            <button
              key={p.key ?? "todos"}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(p.key)}
              className={`h-9 cursor-pointer rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                active ? "bg-ink text-white" : "border border-line bg-surface text-ink hover:bg-bg"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th scope="col" className="th pl-5">Equipo</th>
              <th scope="col" className="th">Marca y serial</th>
              <th scope="col" className="th">Ubicación</th>
              <th scope="col" className="th pr-5">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((a) => {
              const st = ASSET_STATUS[a.status];
              const brand = [a.brand, a.model].filter(Boolean).join(" ");
              return (
                <tr key={a.id} onClick={() => setEditing(a)} className="cursor-pointer hover:bg-bg">
                  <td className="td pl-5">
                    {/* El botón es la forma accesible de abrir el panel; la fila entera también responde al clic. */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(a);
                      }}
                      className="cursor-pointer text-left font-semibold hover:underline"
                    >
                      {a.name ?? a.type}
                      <span className="sr-only">, editar equipo</span>
                    </button>
                    {a.name && <p className="text-[13px] text-muted">{a.type}</p>}
                  </td>
                  <td className="td">
                    <p>{brand || "—"}</p>
                    {a.serial && <p className="text-[13px] text-muted">SN {a.serial}</p>}
                  </td>
                  <td className="td">{a.location ?? "—"}</td>
                  <td className="td pr-5">
                    <ToneChip tone={st.tone}>{st.label}</ToneChip>
                  </td>
                </tr>
              );
            })}
            {!visible.length && (
              <tr>
                <td colSpan={4} className="td px-5 text-center text-muted">
                  Ningún equipo coincide con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted" aria-live="polite">
          Mostrando {visible.length} de {assets.length} equipos
        </p>
        <button type="button" className="link inline-flex cursor-pointer items-center gap-1 text-sm" onClick={() => setEditing(null)}>
          <Plus size={16} aria-hidden />
          Agregar equipo
        </button>
      </div>
      {panel}
    </>
  );
}

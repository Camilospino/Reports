"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { cop } from "@/lib/format";
import { addItem, deleteItem, updateItem, type ItemInput } from "./actions";

type Item = { id: string; description: string; quantity: number; unit_price: number; total: number };
type Material = { id: string; name: string; unit: string; unit_price: number };

const num = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 2 });

export function ItemsTable({
  orderId,
  items,
  total,
  materials,
  locked,
}: {
  orderId: string;
  items: Item[];
  total: number;
  materials: Material[];
  locked: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null); // id del ítem, "new" o null
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.error) setError(r.error);
      else {
        setEditing(null);
        router.refresh();
      }
    });

  return (
    <SectionCard
      title="Materiales y mano de obra"
      bodyClassName="px-2 pt-3 pb-2"
      action={
        !locked && editing !== "new" ? (
          <button type="button" className="link inline-flex items-center gap-1.5 text-sm" onClick={() => setEditing("new")}>
            <Plus size={16} aria-hidden /> Agregar ítem
          </button>
        ) : undefined
      }
    >
      {locked && <p className="px-3 pb-2 text-[13px] text-muted">La orden está facturada: sus materiales ya no cambian.</p>}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr>
              <th className="th">Ítem</th>
              <th className="th text-right">Cant.</th>
              <th className="th text-right">Valor unit.</th>
              <th className="th text-right">Total</th>
              {!locked && (
                <th className="th w-[88px]">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && editing !== "new" && (
              <tr>
                <td colSpan={5} className="td text-muted">
                  Aún no hay materiales registrados.
                </td>
              </tr>
            )}
            {items.map((it) =>
              editing === it.id ? (
                <ItemForm
                  key={it.id}
                  initial={it}
                  materials={materials}
                  pending={pending}
                  onCancel={() => setEditing(null)}
                  onSave={(v) => run(() => updateItem(orderId, it.id, v))}
                />
              ) : (
                <tr key={it.id}>
                  <td className="td">{it.description}</td>
                  <td className="td font-display tabular text-right">{num(it.quantity)}</td>
                  <td className="td font-display tabular text-right">{cop(it.unit_price)}</td>
                  <td className="td font-display tabular text-right">{cop(it.total)}</td>
                  {!locked && (
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${it.description}`}
                          className="btn h-9 w-9 px-0 text-muted hover:bg-bg hover:text-ink"
                          onClick={() => setEditing(it.id)}
                        >
                          <Pencil size={16} aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label={`Quitar ${it.description}`}
                          className="btn h-9 w-9 px-0 text-muted hover:bg-bg hover:text-[#9B1C1C]"
                          disabled={pending}
                          onClick={() => confirm(`¿Quitar "${it.description}"?`) && run(() => deleteItem(orderId, it.id))}
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ),
            )}
            {editing === "new" && (
              <ItemForm
                materials={materials}
                pending={pending}
                onCancel={() => setEditing(null)}
                onSave={(v) => run(() => addItem(orderId, v))}
              />
            )}
            <tr>
              <td colSpan={3} className="border-t-2 border-ink px-3 py-3 font-semibold">
                Total (IVA incluido)
              </td>
              <td className="font-display tabular border-t-2 border-ink px-3 py-3 text-right text-lg font-bold">{cop(total)}</td>
              {!locked && <td className="border-t-2 border-ink" />}
            </tr>
          </tbody>
        </table>
      </div>
      {error && (
        <p role="alert" className="px-3 pt-2 text-sm text-[#9B1C1C]">
          {error}
        </p>
      )}
    </SectionCard>
  );
}

function ItemForm({
  initial,
  materials,
  pending,
  onSave,
  onCancel,
}: {
  initial?: Item;
  materials: Material[];
  pending: boolean;
  onSave: (v: ItemInput) => void;
  onCancel: () => void;
}) {
  const [materialId, setMaterialId] = useState<string>("");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [price, setPrice] = useState(String(initial?.unit_price ?? ""));
  const total = (Number(quantity) || 0) * (Number(price) || 0);

  return (
    <tr className="bg-bg/60">
      <td className="td">
        {!initial && (
          <>
            <label htmlFor="it-material" className="sr-only">
              Del catálogo
            </label>
            <select
              id="it-material"
              className="input mb-2 h-9"
              value={materialId}
              onChange={(e) => {
                setMaterialId(e.target.value);
                const m = materials.find((x) => x.id === e.target.value);
                if (m) {
                  setDescription(m.name);
                  setPrice(String(m.unit_price));
                }
              }}
            >
              <option value="">Ítem libre (mano de obra, otro)</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {cop(m.unit_price)}/{m.unit}
                </option>
              ))}
            </select>
          </>
        )}
        <label htmlFor="it-desc" className="sr-only">
          Descripción
        </label>
        <input
          id="it-desc"
          className="input h-9"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mano de obra instalación"
          autoFocus
        />
      </td>
      <td className="td">
        <label htmlFor="it-qty" className="sr-only">
          Cantidad
        </label>
        <input
          id="it-qty"
          className="input h-9 w-20 text-right"
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value.replace(",", "."))}
        />
      </td>
      <td className="td">
        <label htmlFor="it-price" className="sr-only">
          Valor unitario
        </label>
        <input
          id="it-price"
          className="input h-9 w-32 text-right"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="0"
        />
      </td>
      <td className="td font-display tabular text-right">{cop(total)}</td>
      <td className="td">
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            className="btn-primary h-9 px-3"
            disabled={pending}
            onClick={() =>
              onSave({
                description,
                quantity: Number(quantity),
                unit_price: Number(price),
                material_id: materialId || null,
              })
            }
          >
            Guardar
          </button>
          <button type="button" className="text-xs text-muted hover:underline" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  );
}

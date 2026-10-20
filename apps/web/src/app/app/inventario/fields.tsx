import { qty } from "@/lib/format";

// Campos de material y de tipo de servicio, compartidos por "nuevo" y "editar".

const Optional = () => <span className="font-normal text-muted">(opcional)</span>;
const UNITS = ["und", "m", "lb", "kg", "par", "rollo", "caja", "galón", "h"];

export type MaterialValues = {
  name: string;
  sku: string | null;
  unit: string;
  unit_price: number;
  min_stock: number;
  track_stock: boolean;
};

export function MaterialFields({ values }: { values?: MaterialValues }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="name">Nombre</label>
        <input id="name" name="name" required maxLength={120} placeholder="Cámara domo 2 MP" defaultValue={values?.name} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="sku">Referencia <Optional /></label>
        <input id="sku" name="sku" maxLength={40} placeholder="DS-2CE76D0T" defaultValue={values?.sku ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="unit">Unidad</label>
        <input id="unit" name="unit" required maxLength={12} list="unidades" defaultValue={values?.unit ?? "und"} className="input" />
        <datalist id="unidades">
          {UNITS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="label" htmlFor="unit_price">Precio de venta por unidad</label>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">$</span>
          <input
            id="unit_price"
            name="unit_price"
            required
            inputMode="numeric"
            placeholder="185.000"
            defaultValue={values ? Math.round(values.unit_price).toLocaleString("es-CO") : ""}
            className="input font-display tabular pl-6"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="min_stock">Stock mínimo</label>
        <input
          id="min_stock"
          name="min_stock"
          inputMode="decimal"
          defaultValue={values ? qty(values.min_stock) : "0"}
          className="input font-display tabular"
          aria-describedby="min-hint"
        />
        <p id="min-hint" className="mt-1 text-xs text-muted">Te avisamos en el inicio cuando quede esta cantidad o menos.</p>
      </div>
      <label className="flex items-start gap-3 sm:col-span-2">
        <input type="checkbox" name="track_stock" defaultChecked={values?.track_stock ?? true} className="mt-0.5 size-5 accent-[var(--primary)]" />
        <span className="text-sm">
          <span className="font-medium">Llevar control de stock</span>
          <span className="block text-muted">Desmárcalo para cosas que no se guardan en bodega, como horas de mano de obra.</span>
        </span>
      </label>
    </div>
  );
}

export type ServiceValues = {
  name: string;
  estimated_minutes: number;
  skill: string | null;
  warranty_months: number | null;
  checklist: string[];
};

export function ServiceFields({ values, skills }: { values?: ServiceValues; skills: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="name">Nombre</label>
        <input id="name" name="name" required maxLength={120} placeholder="Mantenimiento aire acondicionado" defaultValue={values?.name} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="estimated_minutes">Duración estimada (minutos)</label>
        <input
          id="estimated_minutes"
          name="estimated_minutes"
          type="number"
          min={15}
          max={1440}
          step={15}
          required
          defaultValue={values?.estimated_minutes ?? 60}
          className="input font-display tabular"
          aria-describedby="duration-hint"
        />
        <p id="duration-hint" className="mt-1 text-xs text-muted">Ocupa este tiempo en la agenda del técnico.</p>
      </div>
      <div>
        <label className="label" htmlFor="warranty_months">Garantía en meses <Optional /></label>
        <input
          id="warranty_months"
          name="warranty_months"
          type="number"
          min={0}
          max={60}
          defaultValue={values?.warranty_months ?? ""}
          className="input font-display tabular"
          aria-describedby="warranty-hint"
        />
        <p id="warranty-hint" className="mt-1 text-xs text-muted">Aparece en el reporte que recibe el cliente.</p>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="skill">Especialidad requerida <Optional /></label>
        <input id="skill" name="skill" maxLength={40} list="especialidades" placeholder="CCTV" defaultValue={values?.skill ?? ""} className="input" aria-describedby="skill-hint" />
        <datalist id="especialidades">
          {skills.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <p id="skill-hint" className="mt-1 text-xs text-muted">La agenda sugiere técnicos con esta especialidad.</p>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="checklist">Lista de chequeo <Optional /></label>
        <textarea
          id="checklist"
          name="checklist"
          rows={6}
          placeholder={"Limpiar filtros\nRevisar drenaje\nMedir presión de gas"}
          defaultValue={values?.checklist.join("\n")}
          className="textarea"
          aria-describedby="checklist-hint"
        />
        <p id="checklist-hint" className="mt-1 text-xs text-muted">Un paso por línea. El técnico los marca en la app antes de cerrar la orden.</p>
      </div>
    </div>
  );
}

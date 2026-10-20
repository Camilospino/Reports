import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireStaff } from "@/lib/session";
import { createMaterial } from "../actions";
import { MaterialFields } from "../fields";

export const metadata = { title: "Nuevo material · Tecnio" };

export default async function NewMaterialPage() {
  await requireStaff();
  return (
    <>
      <nav aria-label="Migas" className="mb-2 text-sm text-muted">
        <Link href="/app/inventario" className="hover:underline">Inventario</Link> / Nuevo material
      </nav>
      <PageHeader title="Nuevo material" />
      <ActionForm action={createMaterial} submit="Crear material" className="card grid max-w-3xl gap-4">
        <MaterialFields />
        <div className="sm:max-w-[calc(50%-0.5rem)]">
          <label className="label" htmlFor="stock">Stock inicial</label>
          <input id="stock" name="stock" inputMode="decimal" defaultValue="0" className="input font-display tabular" aria-describedby="stock-hint" />
          <p id="stock-hint" className="mt-1 text-xs text-muted">Lo que tienes hoy en bodega. Después se ajusta con entradas y salidas.</p>
        </div>
      </ActionForm>
    </>
  );
}

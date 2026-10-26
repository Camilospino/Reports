"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui/form-message";
import { CustomerCombobox } from "@/components/ui/customer-combobox";
import { PRIORITY_LABELS, duration } from "@/lib/format";
import { createWorkOrder } from "../actions";

type Props = {
  today: string;
  initialCustomerId?: string;
  customers: { id: string; name: string }[];
  sites: { id: string; customer_id: string; address: string; neighborhood: string | null }[];
  assets: { id: string; site_id: string; type: string; brand: string | null; model: string | null }[];
  serviceTypes: { id: string; name: string; estimated_minutes: number; checklist: string[] }[];
  technicians: { id: string; full_name: string }[];
  installation?: { id: string; label: string; customer_id: string; site_id: string };
  initialServiceTypeId?: string;
  initialDate?: string;
};

export function NewOrderForm({
  today,
  initialCustomerId,
  customers,
  sites,
  assets,
  serviceTypes,
  technicians,
  installation,
  initialServiceTypeId,
  initialDate,
}: Props) {
  const [state, action, pending] = useActionState(createWorkOrder, null);
  const [customerId, setCustomerId] = useState(initialCustomerId ?? (customers.length ? "" : "new"));
  const [siteId, setSiteId] = useState(installation?.site_id ?? "");
  const initialService = serviceTypes.find((s) => s.id === initialServiceTypeId);
  const [title, setTitle] = useState(initialService?.name ?? "");
  const [newName, setNewName] = useState("");
  const [serviceId, setServiceId] = useState(initialService?.id ?? "");
  const service = serviceTypes.find((s) => s.id === serviceId);
  const customerSites = sites.filter((s) => s.customer_id === customerId);
  const effectiveSite = customerId === "new" ? "new" : siteId || customerSites[0]?.id || "new";
  const siteAssets = assets.filter((a) => a.site_id === effectiveSite);
  // La orden queda en el historial de la instalación mientras siga siendo de ese cliente.
  const linked = installation && customerId === installation.customer_id ? installation : null;

  return (
    <form action={action} className="grid max-w-4xl gap-6">
      {linked && (
        <>
          <input type="hidden" name="installation_id" value={linked.id} />
          <p className="card py-3.5 text-sm">
            Esta orden queda en el historial de la instalación <strong>{linked.label}</strong>.
          </p>
        </>
      )}
      <fieldset className="card grid gap-4 sm:grid-cols-2">
        <legend className="font-display float-left mb-1 w-full text-lg font-bold">Cliente y lugar</legend>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="customer_id">Cliente</label>
          <CustomerCombobox
            id="customer_id"
            name="customer_id"
            customers={customers.map((c) => ({ id: c.id, name: c.name }))}
            value={customerId}
            onChange={(id, text) => {
              setCustomerId(id);
              setSiteId("");
              if (id === "new") setNewName(text);
            }}
            allowNew
            required
          />
        </div>

        {customerId === "new" && (
          <>
            <div>
              <label className="label" htmlFor="customer_name">Nombre del cliente</label>
              <input
                id="customer_name"
                name="customer_name"
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="customer_contact">Persona de contacto</label>
              <input id="customer_contact" name="customer_contact" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="customer_phone">WhatsApp del cliente</label>
              <input id="customer_phone" name="customer_phone" type="tel" placeholder="300 111 2233" className="input" />
            </div>
          </>
        )}

        {customerId && customerId !== "new" && (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="site_id">Sede / dirección</label>
            <select id="site_id" name="site_id" className="input" value={effectiveSite} onChange={(e) => setSiteId(e.target.value)}>
              {customerSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.address}
                  {s.neighborhood ? ` · ${s.neighborhood}` : ""}
                </option>
              ))}
              <option value="new">+ Otra dirección</option>
            </select>
          </div>
        )}

        {effectiveSite === "new" && customerId && (
          <>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="address">Dirección</label>
              <input id="address" name="address" placeholder="Calle 93 # 11-26, oficina 302" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="neighborhood">Barrio</label>
              <input id="neighborhood" name="neighborhood" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="city">Ciudad</label>
              <input id="city" name="city" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="location">
                Ubicación <span className="font-normal text-muted">(opcional)</span>
              </label>
              <input
                id="location"
                name="location"
                placeholder="Pega el enlace de Google Maps o coordenadas (4.65, -74.06)"
                className="input"
                aria-describedby="location-hint"
              />
              <p id="location-hint" className="mt-1 text-xs text-muted">
                Con la ubicación, el técnico abre &quot;Cómo llegar&quot; en Google Maps o Waze.
              </p>
            </div>
          </>
        )}

        {siteAssets.length > 0 && (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="asset_id">
              Equipo <span className="font-normal text-muted">(opcional)</span>
            </label>
            <select id="asset_id" name="asset_id" className="input" defaultValue="">
              <option value="">Ninguno</option>
              {siteAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {[a.type, a.brand, a.model].filter(Boolean).join(" · ")}
                </option>
              ))}
            </select>
          </div>
        )}
      </fieldset>

      <fieldset className="card grid gap-4 sm:grid-cols-2">
        <legend className="font-display float-left mb-1 w-full text-lg font-bold">Trabajo</legend>
        <div>
          <label className="label" htmlFor="service_type_id">Tipo de servicio</label>
          <select
            id="service_type_id"
            name="service_type_id"
            className="input"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              const st = serviceTypes.find((s) => s.id === e.target.value);
              if (st && !title) setTitle(st.name);
            }}
            aria-describedby="service-hint"
          >
            <option value="">Sin tipo</option>
            {serviceTypes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <p id="service-hint" className="mt-1 text-xs text-muted">
            {service
              ? `Duración ${duration(service.estimated_minutes * 60_000)} · ${service.checklist.length} ítems de chequeo`
              : "Copia su lista de chequeo y su duración."}
          </p>
        </div>
        <div>
          <label className="label" htmlFor="priority">Prioridad</label>
          <select id="priority" name="priority" className="input" defaultValue="normal">
            {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">Título</label>
          <input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Instalación de 8 cámaras" className="input" required />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">Descripción</label>
          <textarea id="description" name="description" rows={3} className="textarea" placeholder="Qué hay que hacer, qué pidió el cliente…" />
        </div>
        {service && service.checklist.length > 0 && (
          <div className="sm:col-span-2">
            <p className="label">Lista de chequeo que se copiará</p>
            <ul className="grid gap-1 text-sm text-muted sm:grid-cols-2">
              {service.checklist.map((c, i) => (
                <li key={i}>· {c}</li>
              ))}
            </ul>
          </div>
        )}
      </fieldset>

      <fieldset className="card grid gap-4 sm:grid-cols-3">
        <legend className="font-display float-left mb-1 w-full text-lg font-bold">Programación</legend>
        <div>
          <label className="label" htmlFor="date">Fecha</label>
          <input id="date" name="date" type="date" defaultValue={initialDate ?? today} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="time">Hora</label>
          <input id="time" name="time" type="time" step={900} defaultValue="08:00" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="technician_id">
            Técnico <span className="font-normal text-muted">(opcional)</span>
          </label>
          <select id="technician_id" name="technician_id" className="input" defaultValue="">
            <option value="">Sin asignar</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </div>
      </fieldset>

      <FormMessage state={state} />
      <div className="flex flex-wrap gap-2.5">
        <button className="btn-accent" disabled={pending}>{pending ? "Creando…" : "Crear orden"}</button>
        <Link href="/app/ordenes" className="btn-outline">Cancelar</Link>
      </div>
    </form>
  );
}

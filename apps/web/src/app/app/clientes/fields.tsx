import { formatPhone } from "@/lib/format";

// Campos de cliente y de sede, compartidos por "Nuevo cliente" y la ficha del cliente.
// `prefix` evita ids repetidos cuando hay varios formularios de sede en la misma página.

const Optional = () => <span className="font-normal text-muted">(opcional)</span>;

export type CustomerValues = {
  name: string;
  contact_name: string | null;
  phone_whatsapp: string | null;
  email: string | null;
  tax_id: string | null;
  notes: string | null;
};

export function CustomerFields({ values }: { values?: CustomerValues }) {
  return (
    <div className="clear-both grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="name">Nombre o razón social</label>
        <input id="name" name="name" required maxLength={120} placeholder="Clínica Santa Fe" defaultValue={values?.name} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="contact_name">Persona de contacto <Optional /></label>
        <input id="contact_name" name="contact_name" maxLength={120} defaultValue={values?.contact_name ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="phone_whatsapp">WhatsApp <Optional /></label>
        <input
          id="phone_whatsapp"
          name="phone_whatsapp"
          type="tel"
          inputMode="tel"
          placeholder="300 111 2233"
          defaultValue={values?.phone_whatsapp ? formatPhone(values.phone_whatsapp) : ""}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="email">Correo <Optional /></label>
        <input id="email" name="email" type="email" defaultValue={values?.email ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="tax_id">NIT o cédula <Optional /></label>
        <input id="tax_id" name="tax_id" maxLength={30} placeholder="900.123.456-7" defaultValue={values?.tax_id ?? ""} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">Notas internas <Optional /></label>
        <textarea id="notes" name="notes" rows={2} maxLength={500} placeholder="Horario de atención, forma de pago…" defaultValue={values?.notes ?? ""} className="textarea" />
      </div>
    </div>
  );
}

export type SiteValues = {
  address: string;
  neighborhood: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  access_notes: string | null;
};

export function SiteFields({ prefix, values, requireAddress = true }: { prefix: string; values?: SiteValues; requireAddress?: boolean }) {
  const id = (f: string) => `${prefix}-${f}`;
  return (
    <div className="clear-both grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor={id("address")}>Dirección {!requireAddress && <Optional />}</label>
        <input id={id("address")} name="address" required={requireAddress} maxLength={200} placeholder="Calle 93 # 11-26, oficina 302" defaultValue={values?.address} className="input" />
      </div>
      <div>
        <label className="label" htmlFor={id("neighborhood")}>Barrio <Optional /></label>
        <input id={id("neighborhood")} name="neighborhood" maxLength={80} defaultValue={values?.neighborhood ?? ""} className="input" />
      </div>
      <div>
        <label className="label" htmlFor={id("city")}>Ciudad <Optional /></label>
        <input id={id("city")} name="city" maxLength={80} placeholder="Bogotá" defaultValue={values?.city ?? ""} className="input" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={id("location")}>Ubicación <Optional /></label>
        <input
          id={id("location")}
          name="location"
          placeholder="Pega el enlace de Google Maps o coordenadas (4.65, -74.06)"
          defaultValue={values?.lat != null && values.lng != null ? `${values.lat}, ${values.lng}` : ""}
          className="input"
          aria-describedby={id("location-hint")}
        />
        <p id={id("location-hint")} className="mt-1 text-xs text-muted">
          Con la ubicación, el técnico abre &quot;Cómo llegar&quot; en Google Maps o Waze.
        </p>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor={id("access_notes")}>Indicaciones de acceso <Optional /></label>
        <input id={id("access_notes")} name="access_notes" maxLength={300} placeholder="Anunciarse en portería" defaultValue={values?.access_notes ?? ""} className="input" />
      </div>
    </div>
  );
}

"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from "./config";
import { track } from "./analytics";
import { WhatsappLink } from "./whatsapp";
import { COMPANY_TYPES, TECHNICIAN_COUNTS, validateLead, type LeadErrors, type LeadField, type LeadInput } from "./lead";
import ui from "./landing.module.css";
import styles from "./demo.module.css";

type Status = "idle" | "sending" | "success" | "error";

const FIELD_ORDER: LeadField[] = ["name", "contact", "companyType", "technicians", "consent"];

// 573002823551 → 300 282 3551
const whatsappLabel = WHATSAPP_NUMBER.replace(/^57/, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");

// `sector`: en las páginas de cada sector, el tipo de empresa ya viene elegido.
export function Demo({ sector = "" }: { sector?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<LeadInput>({ name: "", contact: "", companyType: sector, technicians: "", consent: false });
  const [errors, setErrors] = useState<LeadErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  const set = <K extends LeadField>(field: K, value: LeadInput[K]) => {
    setValues((v) => ({ ...v, [field]: value }));
    // El error de un campo se borra en cuanto la persona lo corrige.
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const focusFirstError = (errs: LeadErrors) => {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validateLead(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirstError(errs);
      return;
    }

    setStatus("sending");
    setServerError("");
    const website = new FormData(e.currentTarget).get("website");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website, source: window.location.pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        track("envío formulario", { tipo: values.companyType, tecnicos: values.technicians });
        return;
      }
      if (data.errors) {
        setErrors(data.errors);
        focusFirstError(data.errors);
        setStatus("idle");
        return;
      }
      setServerError(data.error ?? "No pudimos enviar tus datos. Intenta de nuevo.");
      setStatus("error");
    } catch {
      setServerError("No hay conexión. Revisa tu internet e intenta de nuevo.");
      setStatus("error");
    }
  };

  const describedBy = (field: LeadField) => (errors[field] ? `demo-${field}-error` : undefined);

  return (
    <section id="demo" aria-labelledby="demo-titulo" className={ui.section}>
      <div className={ui.container}>
        <div className={styles.block}>
          <div className={styles.intro}>
            <h2 id="demo-titulo" className={`${ui.h2} ${styles.title}`}>
              Mira tu empresa en Tecnio.
            </h2>
            <p className={styles.lead}>Te armamos una demo con tus tipos de trabajo.</p>
            <ul className={styles.contact}>
              <li>
                Correo: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </li>
              <li>
                WhatsApp: <WhatsappLink lugar="bloque demo">{whatsappLabel}</WhatsappLink>
              </li>
            </ul>
          </div>

          {status === "success" ? (
            <div className={styles.success} role="status">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M7.5 12.5l3 3 6-6.5" />
              </svg>
              <p className={styles.successTitle}>Recibido.</p>
              <p>Te escribimos en menos de [X] horas.</p>
            </div>
          ) : (
            <form ref={formRef} className={styles.form} noValidate onSubmit={onSubmit} aria-describedby={serverError ? "demo-server-error" : undefined}>
              <Field id="name" label="Nombre" error={errors.name}>
                <input
                  id="demo-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy("name")}
                  className={styles.input}
                />
              </Field>

              <Field id="contact" label="Correo o WhatsApp" error={errors.contact}>
                <input
                  id="demo-contact"
                  name="contact"
                  autoComplete="email"
                  required
                  maxLength={160}
                  value={values.contact}
                  onChange={(e) => set("contact", e.target.value)}
                  aria-invalid={Boolean(errors.contact)}
                  aria-describedby={describedBy("contact")}
                  className={styles.input}
                />
              </Field>

              <div className={styles.row}>
                <Field id="companyType" label="Tipo de empresa" error={errors.companyType}>
                  <select
                    id="demo-companyType"
                    name="companyType"
                    required
                    value={values.companyType}
                    onChange={(e) => set("companyType", e.target.value)}
                    aria-invalid={Boolean(errors.companyType)}
                    aria-describedby={describedBy("companyType")}
                    className={`${styles.input} ${styles.select}`}
                  >
                    <option value="" disabled>
                      Elige una opción
                    </option>
                    {COMPANY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="technicians" label="¿Cuántos técnicos tienes?" error={errors.technicians}>
                  <select
                    id="demo-technicians"
                    name="technicians"
                    required
                    value={values.technicians}
                    onChange={(e) => set("technicians", e.target.value)}
                    aria-invalid={Boolean(errors.technicians)}
                    aria-describedby={describedBy("technicians")}
                    className={`${styles.input} ${styles.select}`}
                  >
                    <option value="" disabled>
                      Elige una opción
                    </option>
                    {TECHNICIAN_COUNTS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div>
                <label className={styles.consent}>
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    checked={values.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    aria-invalid={Boolean(errors.consent)}
                    aria-describedby={describedBy("consent")}
                  />
                  {/* Mismo texto que CONSENT_TEXT, que es el que se guarda con el lead. */}
                  <span>
                    Autorizo el tratamiento de mis datos personales según la{" "}
                    <Link href="/privacidad" target="_blank">
                      Política de privacidad
                    </Link>{" "}
                    (Ley 1581 de 2012).
                  </span>
                </label>
                {errors.consent && (
                  <p id="demo-consent-error" className={styles.error}>
                    {errors.consent}
                  </p>
                )}
              </div>

              {/* Campo trampa para bots: oculto para las personas y para los lectores de pantalla. */}
              <div className={styles.trap} aria-hidden="true">
                <label htmlFor="demo-website">No llenes este campo</label>
                <input id="demo-website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              {status === "error" && (
                <p id="demo-server-error" className={styles.serverError} role="alert">
                  {serverError}
                </p>
              )}

              <button type="submit" className={`${ui.btn} ${styles.submit}`} disabled={status === "sending"}>
                {status === "sending" ? "Enviando…" : "Quiero ver mi demo"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ id, label, error, children }: { id: LeadField; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={`demo-${id}`} className={styles.label}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`demo-${id}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

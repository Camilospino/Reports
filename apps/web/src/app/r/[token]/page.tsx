import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { cop, initials, orderCode, shortDate, time } from "@/lib/format";
import { siteUrl } from "@/lib/messages";
import { loadReport, reportPhotos, reportSignature, reportTotals, warrantyEnd } from "@/lib/report";
import { Gallery, Rating, ReportFooter } from "./report-client";

type Props = { params: Promise<{ token: string }> };

const when = (d: string) => `${shortDate(d)}, ${time(d)}`;

// Vista previa del enlace en WhatsApp. La imagen sale de opengraph-image.tsx.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const r = await loadReport(token);
  if (!r) return { title: "Reporte no encontrado", robots: { index: false, follow: false } };
  const title = `Servicio completado · ${r.company.name}`;
  const description = `${r.title} · ${orderCode(r.number)} · ${when(r.completed_at)}`;
  return {
    metadataBase: new URL(await siteUrl()),
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, siteName: r.company.name, type: "website", locale: "es_CO" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Reporte que recibe el cliente final por WhatsApp: sin sesión, pensado para celular.
export default async function ReportPage({ params }: Props) {
  const { token } = await params;
  const r = await loadReport(token);
  if (!r) notFound();

  const totals = reportTotals(r);
  const photos = reportPhotos(r).map((p) => ({ ...p, url: `/r/${token}/foto/${p.id}` }));
  const signature = reportSignature(r);
  const warranty = warrantyEnd(r);
  const p = r.company.payment;
  const hasPayment = Boolean(p.nequi || p.account_number);

  return (
    <main className="mx-auto min-h-screen max-w-[480px] bg-surface pb-[200px]">
      <header className="flex items-center gap-3 border-b border-line bg-bg px-5 py-4">
        {r.company.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo externo de la empresa
          <img src={r.company.logo_url} alt="" className="size-10 rounded-[10px] object-contain" />
        ) : (
          <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-ink font-display font-bold text-white">
            {initials(r.company.name)}
          </span>
        )}
        <p className="truncate font-display font-bold">{r.company.name}</p>
      </header>

      <section className="px-5 pt-6 text-center">
        <span className="mx-auto inline-flex size-11 items-center justify-center rounded-full bg-primary text-white">
          <Check size={24} strokeWidth={3} aria-hidden />
        </span>
        <h1 className="mt-3 font-display text-[22px] font-bold">Servicio completado</h1>
        <p className="mt-1 text-[13px] text-muted">
          {r.title} · {when(r.completed_at)}
        </p>
      </section>

      <dl className="mx-5 mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-line-soft py-4">
        <div>
          <dt className="text-xs tracking-[0.04em] text-muted uppercase">Técnico</dt>
          <dd className="mt-0.5 font-semibold">{r.technician ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-[0.04em] text-muted uppercase">Duración</dt>
          <dd className="font-display tabular mt-0.5 font-semibold">
            {r.started_at ? `${time(r.started_at)} – ${time(r.completed_at)}` : time(r.completed_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs tracking-[0.04em] text-muted uppercase">Orden</dt>
          <dd className="font-display tabular mt-0.5 font-semibold">{orderCode(r.number)}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-[0.04em] text-muted uppercase">Garantía</dt>
          <dd className="mt-0.5 font-semibold">
            {warranty ? (
              <>
                {r.warranty_months} {r.warranty_months === 1 ? "mes" : "meses"}
                <span className="block text-xs font-normal text-muted">hasta el {shortDate(warranty)} {warranty.getUTCFullYear()}</span>
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>

      {photos.length > 0 && (
        <section className="mt-6 px-5" aria-labelledby="fotos">
          <h2 id="fotos" className="text-xs font-semibold tracking-[0.04em] text-muted uppercase">
            Antes y después
          </h2>
          <Gallery photos={photos} />
        </section>
      )}

      <section className="mt-6 px-5" aria-labelledby="cobro">
        <h2 id="cobro" className="text-xs font-semibold tracking-[0.04em] text-muted uppercase">
          Resumen de cobro
        </h2>
        <dl className="mt-3 rounded-[14px] bg-bg p-4 text-sm">
          <div className="flex justify-between gap-4 py-1">
            <dt>Equipos y materiales</dt>
            <dd className="font-display tabular">{cop(totals.materials)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <dt>Mano de obra</dt>
            <dd className="font-display tabular">{cop(totals.labor)}</dd>
          </div>
          <div className="mt-2 flex justify-between gap-4 border-t border-line pt-3 text-base font-bold">
            <dt>Total</dt>
            <dd className="font-display tabular">{cop(totals.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 px-5" aria-labelledby="calificacion">
        <h2 id="calificacion" className="text-xs font-semibold tracking-[0.04em] text-muted uppercase">
          ¿Cómo te atendimos?
        </h2>
        <Rating token={token} initial={r.rating} />
      </section>

      <ReportFooter
        token={token}
        total={totals.total}
        orderLabel={orderCode(r.number)}
        company={{ name: r.company.name, phone: r.company.phone }}
        payment={hasPayment ? p : null}
        signature={
          signature
            ? { url: `/r/${token}/foto/${signature.id}`, signer: r.signer_name, at: when(r.completed_at) }
            : null
        }
      />
    </main>
  );
}

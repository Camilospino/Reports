import { ImageResponse } from "next/og";
import { initials, orderCode, shortDate } from "@/lib/format";
import { loadReport } from "@/lib/report";

// Imagen de la vista previa del enlace en WhatsApp: empresa, "Servicio completado" y la orden.
export const alt = "Servicio completado";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await loadReport(token);
  const company = r?.company.name ?? "tecnio";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#F3F5F4", padding: 72, color: "#10211C" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 88, height: 88, borderRadius: 20, background: "#10211C", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 700 }}>
            {initials(company)}
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>{company}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 110 }}>
          <div style={{ width: 96, height: 96, borderRadius: 48, background: "#0E5A4A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div style={{ fontSize: 76, fontWeight: 700 }}>Servicio completado</div>
        </div>
        {r && (
          <div style={{ fontSize: 36, color: "#55645F", marginTop: 28 }}>
            {`${r.title} · ${orderCode(r.number)} · ${shortDate(r.completed_at)}`}
          </div>
        )}
        <div style={{ display: "flex", marginTop: "auto", fontSize: 28, color: "#55645F" }}>Reporte con fotos y firma · tecnio</div>
      </div>
    ),
    size,
  );
}

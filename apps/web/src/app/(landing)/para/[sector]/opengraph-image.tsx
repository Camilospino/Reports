import { ImageResponse } from "next/og";
import { ogFonts } from "@/components/landing/og-fonts";
import { SECTORES, findSector } from "@/components/landing/sectores";

// Vista previa del enlace de cada sector: su título y la lista de chequeo de su orden de ejemplo.
export const alt = "Tecnio para empresas de servicio técnico";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return SECTORES.map((s) => ({ sector: s.slug }));
}

export default async function Image({ params }: { params: Promise<{ sector: string }> }) {
  const sector = findSector((await params).sector) ?? SECTORES[0];
  const lines = sector.order.checklist.slice(0, 4);
  const fonts = await ogFonts(`Tecnio para ${sector.name.toLowerCase()} ${sector.title} ${sector.order.name} ${lines.join(" ")} Completada Firmado por el cliente`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          background: "radial-gradient(circle at 78% 50%, rgba(251,191,36,0.28), #09090B 55%)",
          backgroundColor: "#09090B",
          color: "#FAFAFA",
          fontFamily: "Onest",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: "#FBBF24" }}>Tecnio para {sector.name.toLowerCase()}</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 60, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2.4 }}>{sector.title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 420, borderRadius: 22, background: "#FFFFFF", color: "#161616", padding: "26px 28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ display: "flex", fontSize: 20, fontWeight: 800, lineHeight: 1.2, flex: 1 }}>{sector.order.name}</div>
            <div style={{ display: "flex", borderRadius: 999, background: "#DCFCE7", color: "#15803D", padding: "4px 12px", fontSize: 14, fontWeight: 700 }}>
              Completada
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {lines.map((l) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18 }}>
                <div style={{ display: "flex", width: 20, height: 20, borderRadius: 5, background: "#15803D", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </div>
                {l}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 22, borderTop: "1px solid #E7E5E4", paddingTop: 14, fontSize: 15, color: "#57534E" }}>
            Firmado por el cliente
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

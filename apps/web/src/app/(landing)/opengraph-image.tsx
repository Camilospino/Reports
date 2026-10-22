import { ImageResponse } from "next/og";
import { ogFonts } from "@/components/landing/og-fonts";

// Vista previa del enlace (WhatsApp, LinkedIn, redes): el título y la escena del celular y el portátil.
export const alt = "Tecnio: cada trabajo de tus técnicos, con foto, hora y firma";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AMBER = "#FBBF24";
const ROWS = [
  { label: "Completada", bg: "#DCFCE7", fg: "#15803D", highlight: true },
  { label: "En proceso", bg: "#DBEAFE", fg: "#1E3A8A" },
  { label: "En camino", bg: "#FEF3C7", fg: "#78350F" },
];

// Todas las letras que aparecen en la imagen (solo esas se descargan).
const TEXT =
  "Tecnio para empresas de servicio técnico Cada trabajo, con foto, hora y firma. Y tú lo ves todo. Agenda, técnicos y evidencia, en vivo. " +
  "Hoy en tu empresa Completada En proceso En camino Foto del trabajo · 10:12";

export default async function Image() {
  const fonts = await ogFonts(TEXT);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "radial-gradient(circle at 72% 55%, rgba(251,191,36,0.28), #09090B 55%)",
          backgroundColor: "#09090B",
          color: "#FAFAFA",
          fontFamily: "Onest",
          padding: "64px 0 64px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 520 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <div style={{ fontSize: 34, fontWeight: 800 }}>Tecnio</div>
            <div style={{ fontSize: 22, color: "#A1A1AA" }}>para empresas de servicio técnico</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 72, fontSize: 64, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2.5 }}>
            <div>Cada trabajo, con foto, hora y firma.</div>
            <div style={{ color: AMBER, marginTop: 8 }}>Y tú lo ves todo.</div>
          </div>
          <div style={{ marginTop: "auto", fontSize: 24, color: "#A1A1AA" }}>Agenda, técnicos y evidencia, en vivo.</div>
        </div>

        {/* Escena: celular con la foto y portátil con el panel */}
        <div style={{ display: "flex", position: "relative", flex: 1 }}>
          <div style={{ position: "absolute", left: 178, top: 170, width: 400, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", borderRadius: "14px 14px 0 0", background: "#27272A", padding: 9 }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, borderRadius: 6, background: "#FFFFFF", color: "#161616", padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800 }}>
                  <div>Hoy en tu empresa</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#15803D", fontSize: 13 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: "#15803D" }} />
                    en vivo
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
                  {ROWS.map((r) => (
                    <div
                      key={r.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        borderRadius: 9,
                        border: `1.5px solid ${r.highlight ? AMBER : "#E7E5E4"}`,
                        background: r.highlight ? "#FFFBEB" : "#FFFFFF",
                        padding: "7px 9px",
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3F3F46" }} />
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <div style={{ width: 120, height: 8, borderRadius: 4, background: "#D6D3D1" }} />
                        <div style={{ width: 80, height: 7, borderRadius: 4, background: "#E7E5E4", marginTop: 6 }} />
                      </div>
                      <div style={{ display: "flex", borderRadius: 999, background: r.bg, color: r.fg, padding: "3px 9px", fontSize: 12, fontWeight: 700 }}>
                        {r.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", height: 12, marginLeft: -16, marginRight: -16, borderRadius: "0 0 10px 10px", background: "linear-gradient(#A1A1AA, #71717A)" }} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 80,
              width: 190,
              height: 390,
              display: "flex",
              borderRadius: 36,
              padding: 3,
              background: "linear-gradient(140deg, #A1A1AA 0%, #3F3F46 20%, #18181B 50%, #3F3F46 80%, #A1A1AA 100%)",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                borderRadius: 33,
                background: "linear-gradient(105deg, #3F3F46 48%, #18181B 49%, #18181B 50.5%, #3F3F46 51.5%)",
                justifyContent: "center",
                alignItems: "flex-end",
                paddingBottom: 18,
              }}
            >
              <div style={{ display: "flex", borderRadius: 999, background: "rgba(9,9,11,0.8)", padding: "5px 12px", fontSize: 14 }}>
                Foto del trabajo · 10:12
              </div>
            </div>
          </div>

        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

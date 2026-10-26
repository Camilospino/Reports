import "server-only";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { installationCode } from "@/lib/format";

export type QrLabelsData = {
  company: string;
  installation: { number: number; name: string };
  labels: { name: string; url: string }[];
};

const C = { ink: "#10211C", muted: "#55645F", line: "#DDE3E0" };

// Hoja carta con 3 etiquetas por fila: QR, nombre del equipo, instalación y empresa.
const s = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: C.ink },
  title: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  hint: { color: C.muted, marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  label: { width: 176, padding: 10, borderWidth: 1, borderColor: C.line, borderStyle: "dashed", borderRadius: 8, alignItems: "center" },
  qr: { width: 120, height: 120 },
  name: { marginTop: 6, fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "center" },
  meta: { marginTop: 2, color: C.muted, textAlign: "center" },
});

export async function qrLabelsPdfResponse(d: QrLabelsData): Promise<Response> {
  const images = await Promise.all(d.labels.map((l) => QRCode.toDataURL(l.url, { margin: 1, width: 360, errorCorrectionLevel: "M" })));
  const code = installationCode(d.installation.number);
  const pdf = await renderToBuffer(
    <Document title={`Etiquetas QR ${code}`}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.title}>
          {code} · {d.installation.name}
        </Text>
        <Text style={s.hint}>Recorta por la línea punteada y pega cada etiqueta en su equipo.</Text>
        <View style={s.grid}>
          {d.labels.map((l, i) => (
            <View key={l.url} style={s.label} wrap={false}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no lleva alt */}
              <Image src={images[i]!} style={s.qr} />
              <Text style={s.name}>{l.name}</Text>
              <Text style={s.meta}>{code}</Text>
              <Text style={s.meta}>{d.company}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>,
  );
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${code}-etiquetas-qr.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

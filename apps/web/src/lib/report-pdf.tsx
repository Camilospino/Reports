import "server-only";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { cop, formatPhone, initials, orderCode, shortDate, time } from "@/lib/format";
import {
  downloadAttachment,
  reportPhotos,
  reportSignature,
  reportTotals,
  warrantyEnd,
  type ReportData,
} from "@/lib/report";

// PDF del reporte de servicio: el mismo contenido de /r/[token] más checklist,
// materiales, observaciones y la firma.

const C = { ink: "#10211C", muted: "#55645F", line: "#DDE3E0", soft: "#EEF2F0", bg: "#F3F5F4", accent: "#C2400D", primary: "#0E5A4A" };
const MAX_PHOTOS = 9;

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 56, fontSize: 10, fontFamily: "Helvetica", color: C.ink },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 10, objectFit: "contain" },
  badge: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.ink, color: "#FFFFFF", fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center", paddingTop: 13 },
  company: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  muted: { color: C.muted },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  done: { color: C.primary, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 2 },
  label: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  section: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginTop: 18, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  grid: { flexDirection: "row", flexWrap: "wrap", borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.soft, paddingVertical: 10 },
  cell: { width: "33.33%", paddingVertical: 5, paddingRight: 8 },
  value: { fontFamily: "Helvetica-Bold" },
  check: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  box: { width: 9, height: 9, borderRadius: 2, borderWidth: 1, borderColor: C.muted },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photo: { width: 166, height: 166, borderRadius: 6, objectFit: "cover" },
  caption: { fontSize: 8, color: C.muted, marginTop: 3, width: 166 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 6, marginBottom: 2 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.soft, paddingVertical: 6 },
  cDesc: { flex: 1, paddingRight: 8 },
  cNum: { width: 90, textAlign: "right" },
  cQty: { width: 50, textAlign: "right" },
  summary: { marginTop: 10, marginLeft: "auto", width: 240, backgroundColor: C.bg, borderRadius: 8, padding: 10 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  sumTotal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, marginTop: 6, paddingTop: 6, fontSize: 12, fontFamily: "Helvetica-Bold" },
  notes: { padding: 10, backgroundColor: C.bg, borderRadius: 8 },
  signature: { width: 220, height: 90, objectFit: "contain", borderBottomWidth: 1, borderBottomColor: C.ink },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 8, color: C.muted, flexDirection: "row", justifyContent: "space-between" },
});

type Img = { data: Buffer; format: "jpg" | "png" };

async function image(path: string): Promise<Img | null> {
  const blob = await downloadAttachment(path);
  if (!blob) return null;
  const format = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : null;
  // react-pdf solo pinta JPG y PNG (las webp se omiten).
  return format ? { data: Buffer.from(await blob.arrayBuffer()), format } : null;
}

function ReportDocument({ r, photos, signature }: { r: ReportData; photos: { caption: string; img: Img }[]; signature: Img | null }) {
  const totals = reportTotals(r);
  const warranty = warrantyEnd(r);
  const place = [r.neighborhood, r.city].filter(Boolean).join(", ");
  const cells: [string, string][] = [
    ["Cliente", r.customer],
    ["Lugar", place || "—"],
    ["Servicio", r.service_type ?? "—"],
    ["Técnico", r.technician ?? "—"],
    ["Fecha", `${shortDate(r.completed_at)} ${new Date(r.completed_at).getUTCFullYear()}`],
    ["Duración", r.started_at ? `${time(r.started_at)} – ${time(r.completed_at)}` : `Cierre ${time(r.completed_at)}`],
    [
      "Garantía",
      warranty ? `${r.warranty_months} ${r.warranty_months === 1 ? "mes" : "meses"} (hasta ${shortDate(warranty)} ${warranty.getUTCFullYear()})` : "—",
    ],
  ];

  return (
    <Document title={`Reporte ${orderCode(r.number)} · ${r.company.name}`} author={r.company.name} language="es-CO">
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            {r.company.logo_url ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no lleva alt
              <Image src={r.company.logo_url} style={s.logo} />
            ) : (
              <Text style={s.badge}>{initials(r.company.name)}</Text>
            )}
            <View>
              <Text style={s.company}>{r.company.name}</Text>
              {r.company.nit && <Text style={s.muted}>NIT {r.company.nit}</Text>}
              {r.company.phone && <Text style={s.muted}>Tel. {formatPhone(r.company.phone)}</Text>}
            </View>
          </View>
          <View>
            <Text style={s.title}>Reporte de servicio</Text>
            <Text style={[s.muted, { textAlign: "right" }]}>{orderCode(r.number)}</Text>
            <Text style={s.done}>Servicio completado</Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 10 }}>{r.title}</Text>
        <View style={s.grid}>
          {cells.map(([label, value]) => (
            <View key={label} style={s.cell}>
              <Text style={s.label}>{label}</Text>
              <Text style={s.value}>{value}</Text>
            </View>
          ))}
        </View>

        {r.checklist.length > 0 && (
          <View>
            <Text style={s.section}>Lista de chequeo</Text>
            {r.checklist.map((c, i) => (
              <View key={i} style={s.check}>
                {/* Helvetica no trae el símbolo ✓: una casilla llena = hecho */}
                <View style={[s.box, c.done ? { backgroundColor: C.primary, borderColor: C.primary } : {}]} />
                <Text style={c.done ? undefined : s.muted}>{c.label}</Text>
              </View>
            ))}
          </View>
        )}

        {r.observations && (
          <View wrap={false}>
            <Text style={s.section}>Observaciones del técnico</Text>
            <Text style={s.notes}>{r.observations}</Text>
          </View>
        )}

        {photos.length > 0 && (
          <View>
            <Text style={s.section}>Antes y después</Text>
            <View style={s.photos}>
              {photos.map((p, i) => (
                <View key={i} wrap={false}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no lleva alt */}
                  <Image src={p.img} style={s.photo} />
                  <Text style={s.caption}>{p.caption}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View wrap={false}>
          <Text style={s.section}>Resumen de cobro</Text>
          {r.items.length > 0 && (
            <>
              <View style={s.th}>
                <Text style={[s.cDesc, s.label]}>Ítem</Text>
                <Text style={[s.cQty, s.label]}>Cant.</Text>
                <Text style={[s.cNum, s.label]}>Valor unit.</Text>
                <Text style={[s.cNum, s.label]}>Total</Text>
              </View>
              {r.items.map((i, n) => (
                <View key={n} style={s.tr}>
                  <Text style={s.cDesc}>{i.description}</Text>
                  <Text style={s.cQty}>{Number(i.quantity).toLocaleString("es-CO")}</Text>
                  <Text style={s.cNum}>{cop(i.unit_price)}</Text>
                  <Text style={s.cNum}>{cop(i.total)}</Text>
                </View>
              ))}
            </>
          )}
          <View style={s.summary}>
            <View style={s.sumRow}>
              <Text>Equipos y materiales</Text>
              <Text>{cop(totals.materials)}</Text>
            </View>
            <View style={s.sumRow}>
              <Text>Mano de obra</Text>
              <Text>{cop(totals.labor)}</Text>
            </View>
            <View style={s.sumTotal}>
              <Text>Total</Text>
              <Text>{cop(totals.total)}</Text>
            </View>
          </View>
        </View>

        <View wrap={false}>
          <Text style={s.section}>Recibido a satisfacción</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no lleva alt */}
          {signature ? <Image src={signature} style={s.signature} /> : <View style={[s.signature, { height: 50 }]} />}
          <Text style={{ marginTop: 4, fontFamily: "Helvetica-Bold" }}>{r.signer_name ?? "—"}</Text>
          <Text style={s.muted}>
            {shortDate(r.completed_at)} {new Date(r.completed_at).getUTCFullYear()}, {time(r.completed_at)}
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text>Generado con tecnio</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function reportPdfResponse(r: ReportData): Promise<Response> {
  const list = reportPhotos(r).slice(0, MAX_PHOTOS);
  const sig = reportSignature(r);
  const [imgs, signature] = await Promise.all([
    Promise.all(list.map((p) => image(r.attachments.find((a) => a.id === p.id)!.path))),
    sig ? image(sig.path) : Promise.resolve(null),
  ]);
  const photos = list.flatMap((p, i) => (imgs[i] ? [{ caption: p.caption, img: imgs[i] }] : []));

  const pdf = await renderToBuffer(<ReportDocument r={r} photos={photos} signature={signature} />);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Reporte-${orderCode(r.number)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import "server-only";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { cop, formatPhone, initials, longDate, quoteCode } from "@/lib/format";
import { itemTotal, parseItems } from "@/lib/quotes";

export type QuotePdfData = {
  number: number;
  created_at: string;
  valid_until: string | null;
  notes: string | null;
  items: unknown;
  total: number | string;
  customer: { name: string; contact_name: string | null };
  company: { name: string; nit: string | null; phone: string | null; logo_url: string | null };
};

const C = { ink: "#10211C", muted: "#55645F", line: "#DDE3E0", soft: "#EEF2F0", accent: "#C2400D", primary: "#0E5A4A" };

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: C.ink },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 10, objectFit: "contain" },
  badge: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.accent, color: "#FFFFFF", fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center", paddingTop: 13 },
  company: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  muted: { color: C.muted },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", textAlign: "right" },
  label: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  boxRow: { flexDirection: "row", gap: 24, marginBottom: 20 },
  notes: { marginBottom: 20, padding: 12, backgroundColor: C.soft, borderRadius: 8 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 6, marginBottom: 2 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.soft, paddingVertical: 7 },
  cDesc: { flex: 1, paddingRight: 8 },
  cNum: { width: 90, textAlign: "right" },
  cQty: { width: 50, textAlign: "right" },
  totalRow: { flexDirection: "row", borderTopWidth: 2, borderTopColor: C.ink, paddingTop: 10, marginTop: 4 },
  total: { width: 140, textAlign: "right", fontSize: 14, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 8, color: C.muted, textAlign: "center" },
});

const day = (d: string) => longDate(d.length === 10 ? `${d}T12:00:00-05:00` : d);

function QuoteDocument({ q }: { q: QuotePdfData }) {
  const items = parseItems(q.items);
  return (
    <Document title={`${quoteCode(q.number)} · ${q.company.name}`} author={q.company.name} language="es-CO">
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            {q.company.logo_url ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no lleva alt
              <Image src={q.company.logo_url} style={s.logo} />
            ) : (
              <Text style={s.badge}>{initials(q.company.name)}</Text>
            )}
            <View>
              <Text style={s.company}>{q.company.name}</Text>
              {q.company.nit && <Text style={s.muted}>NIT {q.company.nit}</Text>}
              {q.company.phone && <Text style={s.muted}>Tel. {formatPhone(q.company.phone)}</Text>}
            </View>
          </View>
          <View>
            <Text style={s.title}>Cotización</Text>
            <Text style={[s.muted, { textAlign: "right" }]}>{quoteCode(q.number)}</Text>
          </View>
        </View>

        <View style={s.boxRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Cliente</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{q.customer.name}</Text>
            {q.customer.contact_name && <Text style={s.muted}>{q.customer.contact_name}</Text>}
          </View>
          <View>
            <Text style={s.label}>Fecha</Text>
            <Text>{day(q.created_at)}</Text>
          </View>
          <View>
            <Text style={s.label}>Válida hasta</Text>
            <Text>{q.valid_until ? day(q.valid_until) : "—"}</Text>
          </View>
        </View>

        {q.notes && (
          <View style={s.notes}>
            <Text>{q.notes}</Text>
          </View>
        )}

        <View style={s.th}>
          <Text style={[s.cDesc, s.label]}>Ítem</Text>
          <Text style={[s.cQty, s.label]}>Cant.</Text>
          <Text style={[s.cNum, s.label]}>Valor unit.</Text>
          <Text style={[s.cNum, s.label]}>Total</Text>
        </View>
        {items.map((i, n) => (
          <View key={n} style={s.tr} wrap={false}>
            <Text style={s.cDesc}>{i.description}</Text>
            <Text style={s.cQty}>{i.quantity.toLocaleString("es-CO")}</Text>
            <Text style={s.cNum}>{cop(i.unit_price)}</Text>
            <Text style={s.cNum}>{cop(itemTotal(i))}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>Total (IVA incluido)</Text>
          <Text style={s.total}>{cop(q.total)}</Text>
        </View>

        <Text style={s.footer} fixed>
          Generado con tecnio
        </Text>
      </Page>
    </Document>
  );
}

export async function quotePdfResponse(q: QuotePdfData): Promise<Response> {
  const pdf = await renderToBuffer(<QuoteDocument q={q} />);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quoteCode(q.number)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

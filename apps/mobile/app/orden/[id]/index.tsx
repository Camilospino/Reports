import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowRight, Check, MapPin, MessageCircle, Navigation, Phone } from "lucide-react-native";
import { useStore } from "@/lib/store";
import { advanceStatus, toggleChecklist } from "@/lib/actions";
import { call, directions } from "@/lib/orders";
import { sendReport } from "@/lib/report";
import { formatPhone, longDate, orderCode, time } from "@/lib/format";
import { OrderHeader } from "@/components/order-header";
import { PhotoGrid } from "@/components/photo-grid";
import { Button, Card, SectionLabel, StatusChip, T } from "@/components/ui";
import { colors, fonts } from "@/theme";

// Flujo del técnico: Voy en camino → Llegué → chequeo → fotos del antes → cerrar.
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  if (!order) {
    return (
      <View style={{ flex: 1 }}>
        <OrderHeader title="Orden" subtitle="" />
        <T style={{ padding: 20, color: colors.muted }}>Esta orden ya no está en tu celular. Puede que te la hayan reasignado.</T>
      </View>
    );
  }
  const o = order;
  const open = o.status === "asignada" || o.status === "pendiente" || o.status === "en_camino" || o.status === "en_proceso";
  const done = o.checklist.filter((c) => c.done).length;
  const before = o.photos.filter((p) => p.kind === "foto_antes").length;

  async function advance(to: "en_camino" | "en_proceso") {
    setBusy(true);
    try {
      const gps = await advanceStatus(o.id, to);
      if (!gps) Alert.alert("Sin ubicación", "Se guardó la hora, pero no la ubicación GPS. Revisa el permiso de ubicación.");
    } catch (e) {
      Alert.alert("No se pudo guardar", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <OrderHeader title={orderCode(o.number)} subtitle={o.customer.name} step={open ? "Paso 1 de 2" : undefined} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 + insets.bottom }}>
        <StatusChip status={o.status} />
        <T style={s.title}>{o.title}</T>
        <T style={{ color: colors.muted }}>
          {o.scheduled_start ? `${longDate(o.scheduled_start)} · ${time(o.scheduled_start)}${o.scheduled_end ? ` a ${time(o.scheduled_end)}` : ""}` : "Sin hora"}
        </T>

        <Card style={{ marginTop: 16, gap: 12 }}>
          <View>
            <T style={s.label}>Cliente</T>
            <T style={s.value}>{o.customer.name}</T>
            <T style={s.detail}>
              {[o.customer.contact_name, o.customer.phone_whatsapp && formatPhone(o.customer.phone_whatsapp)].filter(Boolean).join(" · ")}
            </T>
          </View>
          <View>
            <T style={s.label}>Dirección</T>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <MapPin size={16} color={colors.muted} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <T style={s.value}>{o.site?.address ?? "Sin dirección"}</T>
                <T style={s.detail}>{[o.site?.neighborhood, o.site?.city].filter(Boolean).join(", ")}</T>
                {o.site?.access_notes && <T style={s.detail}>{o.site.access_notes}</T>}
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button label="Llamar" variant="outline" icon={<Phone size={18} color={colors.ink} />} onPress={() => call(o.customer.phone_whatsapp)} style={{ flex: 1 }} />
            <Button label="Cómo llegar" variant="outline" icon={<Navigation size={18} color={colors.ink} />} onPress={() => directions(o)} style={{ flex: 1 }} />
          </View>
        </Card>

        {o.description && (
          <>
            <SectionLabel>Qué hay que hacer</SectionLabel>
            <Card>
              <T>{o.description}</T>
            </Card>
          </>
        )}

        {(o.status === "asignada" || o.status === "pendiente") && (
          <Button
            label="Voy en camino"
            variant="accent"
            height={56}
            loading={busy}
            onPress={() => void advance("en_camino")}
            accessibilityHint="Guarda tu ubicación y la hora de salida"
            style={{ marginTop: 22 }}
          />
        )}
        {o.status === "en_camino" && (
          <Button
            label="Llegué"
            variant="accent"
            height={56}
            loading={busy}
            onPress={() => void advance("en_proceso")}
            accessibilityHint="Guarda tu ubicación al llegar"
            style={{ marginTop: 22 }}
          />
        )}

        {(o.status === "en_proceso" || o.status === "completada") && (
          <>
            <SectionLabel right={<T style={{ fontSize: 13, color: colors.muted }}>{`${done} de ${o.checklist.length}`}</T>}>
              Lista de chequeo
            </SectionLabel>
            {o.checklist.length === 0 ? (
              <T style={{ color: colors.muted }}>Esta orden no tiene lista de chequeo.</T>
            ) : (
              <View style={{ gap: 8 }}>
                {o.checklist.map((c, i) => (
                  <Pressable
                    key={i}
                    disabled={o.status !== "en_proceso"}
                    onPress={() => toggleChecklist(o.id, i)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: c.done, disabled: o.status !== "en_proceso" }}
                    accessibilityLabel={c.label}
                    style={s.check}
                  >
                    <View style={[s.box, c.done && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      {c.done && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <T style={{ flex: 1 }}>{c.label}</T>
                  </Pressable>
                ))}
              </View>
            )}

            <SectionLabel>Fotos del antes</SectionLabel>
            <PhotoGrid orderId={o.id} photos={o.photos} kind="foto_antes" editable={o.status === "en_proceso"} />
            {o.status === "en_proceso" && before === 0 && (
              <T style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>Toma al menos una foto antes de empezar el trabajo.</T>
            )}
          </>
        )}

        {o.status === "en_proceso" && (
          <Button
            label="Cerrar orden"
            variant="accent"
            height={56}
            iconRight={<ArrowRight size={18} color="#FFFFFF" />}
            onPress={() => router.push(`/orden/${o.id}/cerrar`)}
            style={{ marginTop: 24 }}
          />
        )}

        {o.status === "completada" && (
          <>
            <SectionLabel>Fotos del después</SectionLabel>
            <PhotoGrid orderId={o.id} photos={o.photos} kind="foto_despues" editable={false} />
            <Card style={{ marginTop: 20, gap: 10 }}>
              <T style={{ fontFamily: fonts.bodySemibold }}>Orden completada{o.signer_name ? ` · recibió ${o.signer_name}` : ""}</T>
              <Button
                label="Enviar reporte por WhatsApp"
                variant="primary"
                icon={<MessageCircle size={18} color="#FFFFFF" />}
                onPress={() => sendReport(o)}
              />
              {!o.public_token && (
                <T style={{ fontSize: 12, color: colors.muted }}>El enlace del reporte estará listo cuando el celular suba el cierre.</T>
              )}
            </Card>
          </>
        )}

        {o.status === "cancelada" && (
          <Card style={{ marginTop: 20 }}>
            <T>Esta orden fue cancelada. No tienes que hacer nada.</T>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: fonts.display, fontSize: 22, marginTop: 10 },
  label: { fontSize: 12, fontFamily: fonts.bodySemibold, color: colors.muted, letterSpacing: 0.5, textTransform: "uppercase" },
  value: { fontFamily: fonts.bodySemibold, marginTop: 2 },
  detail: { fontSize: 13, color: colors.muted },
  check: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
});

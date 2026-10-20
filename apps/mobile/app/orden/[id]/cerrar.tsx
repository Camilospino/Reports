import { useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas";
import { Check, Minus, Plus, Search, X } from "lucide-react-native";
import { getState, useStore } from "@/lib/store";
import { addMaterial, completeOrder, setQuantity } from "@/lib/actions";
import { sync } from "@/lib/sync";
import { sendReport } from "@/lib/report";
import { orderCode } from "@/lib/format";
import { OrderHeader } from "@/components/order-header";
import { PhotoGrid } from "@/components/photo-grid";
import { Button, SectionLabel, T } from "@/components/ui";
import { colors, fonts } from "@/theme";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Firma: fondo blanco y trazo --ink; el lienzo ocupa todo el cuadro.
const SIGNATURE_STYLE = `
  .m-signature-pad { box-shadow: none; border: none; margin: 0; width: 100%; height: 100%; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; }
  body, html { width: 100%; height: 100%; margin: 0; background: #FFFFFF; }
`;

export default function CloseOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const materials = useStore((s) => s.materials);
  const insets = useSafeAreaInsets();
  const signature = useRef<SignatureViewRef>(null);
  const idInput = useRef<TextInput>(null);
  const [observations, setObservations] = useState(order?.observations ?? "");
  const [signerName, setSignerName] = useState("");
  const [signerId, setSignerId] = useState("");
  const [signed, setSigned] = useState(false);
  const [scroll, setScroll] = useState(true);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!order) return null;
  const o = order;
  const stockOf = new Map(materials.map((m) => [m.id, m]));
  // Solo materiales del catálogo: la mano de obra la maneja la oficina.
  const materialItems = o.items.filter((it) => it.material_id);

  function finish() {
    if (!signerName.trim()) return Alert.alert("Falta el nombre", "Escribe el nombre de quien recibe el trabajo.");
    if (!signed) return Alert.alert("Falta la firma", "Pídele al cliente que firme en el cuadro.");
    setSaving(true);
    signature.current?.readSignature(); // responde en onOK con la imagen
  }

  async function onSignature(png: string) {
    try {
      completeOrder(o.id, { observations: observations.trim(), signerName: signerName.trim(), signerId: signerId.trim(), signaturePng: png });
      // Si hay señal, se sube ya y se abre WhatsApp con el reporte. Sin señal queda en la cola.
      await Promise.race([sync(), new Promise((r) => setTimeout(r, 15_000))]);
      const fresh = getState().orders.find((x) => x.id === o.id);
      router.replace(`/orden/${o.id}`);
      if (fresh?.public_token) sendReport(fresh);
      else
        Alert.alert(
          "Orden cerrada",
          "Se guardó en el celular. Cuando haya señal se sube sola y podrás enviar el reporte desde la orden.",
        );
    } catch (e) {
      Alert.alert("No se pudo cerrar", e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <OrderHeader title="Cerrar orden" subtitle={`${orderCode(o.number)} · ${o.customer.name}`} step="Paso 2 de 2" />
      <ScrollView scrollEnabled={scroll} contentContainerStyle={{ padding: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <SectionLabel>Fotos del después</SectionLabel>
        <PhotoGrid orderId={o.id} photos={o.photos} kind="foto_despues" editable />

        <SectionLabel
          right={
            <Pressable onPress={() => setPicker(true)} accessibilityRole="button" accessibilityLabel="Agregar material" hitSlop={10}>
              <T style={s.link}>+ Agregar</T>
            </Pressable>
          }
        >
          Materiales usados
        </SectionLabel>
        <View style={s.card}>
          {materialItems.length === 0 ? (
            <T style={{ color: colors.muted, padding: 14 }}>No has registrado materiales.</T>
          ) : (
            materialItems.map((it, i) => {
              const m = it.material_id ? stockOf.get(it.material_id) : undefined;
              return (
                <View key={it.id} style={[s.itemRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.lineSoft }]}>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontFamily: fonts.bodySemibold }}>{it.description}</T>
                    {m && (
                      <T style={{ fontSize: 12, color: colors.muted }}>
                        Stock: {m.stock.toLocaleString("es-CO")} {m.unit}
                      </T>
                    )}
                  </View>
                  <Pressable
                    style={s.qtyBtn}
                    onPress={() => setQuantity(o.id, it.id, it.quantity - 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar uno de ${it.description}`}
                  >
                    <Minus size={18} color={colors.ink} />
                  </Pressable>
                  <T style={s.qty} accessibilityLabel={`Cantidad ${it.quantity}`}>
                    {it.quantity.toLocaleString("es-CO")}
                  </T>
                  <Pressable
                    style={s.qtyBtn}
                    onPress={() => setQuantity(o.id, it.id, it.quantity + 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar uno de ${it.description}`}
                  >
                    <Plus size={18} color={colors.ink} />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        <SectionLabel>Observaciones</SectionLabel>
        <TextInput
          style={[s.input, { height: 64, paddingTop: 10, textAlignVertical: "top" }]}
          multiline
          numberOfLines={2}
          value={observations}
          onChangeText={setObservations}
          placeholder="Qué se hizo, qué quedó pendiente…"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Observaciones"
        />

        <SectionLabel
          right={
            <Pressable
              onPress={() => {
                signature.current?.clearSignature();
                setSigned(false);
              }}
              accessibilityRole="button"
              accessibilityLabel="Borrar firma"
              hitSlop={10}
            >
              <T style={s.link}>Borrar</T>
            </Pressable>
          }
        >
          Firma del cliente
        </SectionLabel>
        <View style={s.signature} accessible accessibilityLabel="Cuadro para la firma del cliente">
          <SignatureScreen
            ref={signature}
            webStyle={SIGNATURE_STYLE}
            backgroundColor="#FFFFFF"
            penColor={colors.ink}
            imageType="image/png"
            trimWhitespace
            onBegin={() => {
              setScroll(false);
              setSigned(true);
            }}
            onEnd={() => setScroll(true)}
            onOK={(png) => void onSignature(png)}
            onEmpty={() => {
              setSaving(false);
              setSigned(false);
              Alert.alert("Falta la firma", "Pídele al cliente que firme en el cuadro.");
            }}
            webviewContainerStyle={{ backgroundColor: "#FFFFFF" }}
          />
          <View pointerEvents="none" style={s.baseline} />
        </View>
        <T style={[s.inputLabel, { marginTop: 12 }]}>Nombre y cédula de quien recibe</T>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={[s.input, { flex: 3 }]}
            value={signerName}
            onChangeText={setSignerName}
            returnKeyType="next"
            onSubmitEditing={() => idInput.current?.focus()}
            placeholder="Nombre"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Nombre de quien recibe"
          />
          <TextInput
            ref={idInput}
            style={[s.input, { flex: 2 }]}
            value={signerId}
            onChangeText={(t) => setSignerId(t.replace(/[^\d.]/g, ""))}
            keyboardType="number-pad"
            placeholder="Cédula"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Cédula de quien recibe"
          />
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: 12 + insets.bottom }]}>
        <Button
          label="Finalizar y enviar reporte"
          variant="primary"
          height={54}
          loading={saving}
          icon={<Check size={20} color="#FFFFFF" strokeWidth={2.5} />}
          onPress={finish}
          style={{ borderRadius: 14 }}
        />
        <T style={s.hint}>Sin señal se guarda en el celular y se envía al reconectar.</T>
      </View>

      <MaterialPicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={(m) => {
          addMaterial(o.id, m);
          setPicker(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function MaterialPicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (m: ReturnType<typeof getState>["materials"][number]) => void;
}) {
  const materials = useStore((s) => s.materials);
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const list = materials.filter((m) => !q || normalize(m.name).includes(normalize(q)));
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <View style={s.pickerHeader}>
          <T style={{ fontFamily: fonts.display, fontSize: 18, flex: 1 }} accessibilityRole="header">
            Agregar material
          </T>
          <Pressable onPress={onClose} style={s.qtyBtn} accessibilityRole="button" accessibilityLabel="Cerrar">
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>
        <View style={[s.input, { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 20 }]}>
          <Search size={18} color={colors.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Buscar en el catálogo"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink }}
            accessibilityLabel="Buscar material"
            autoFocus
          />
        </View>
        <FlatList
          data={list}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 20 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.lineSoft }} />}
          ListEmptyComponent={<T style={{ color: colors.muted }}>No hay materiales con ese nombre.</T>}
          renderItem={({ item: m }) => (
            <Pressable onPress={() => onPick(m)} style={s.pickRow} accessibilityRole="button" accessibilityLabel={`Agregar ${m.name}`}>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: fonts.bodySemibold }}>{m.name}</T>
                <T style={{ fontSize: 12, color: colors.muted }}>
                  Stock: {m.stock.toLocaleString("es-CO")} {m.unit}
                </T>
              </View>
              <Plus size={20} color={colors.primary} />
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  link: { color: colors.primary, fontFamily: fonts.bodySemibold, fontSize: 14 },
  card: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  qty: { fontFamily: fonts.display, fontSize: 16, minWidth: 28, textAlign: "center" },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  inputLabel: { fontFamily: fonts.bodyMedium, marginBottom: 6 },
  signature: { height: 108, borderRadius: 10, borderWidth: 1, borderColor: colors.line, overflow: "hidden", backgroundColor: "#FFFFFF" },
  baseline: { position: "absolute", left: 16, right: 16, bottom: 26, borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#9AA6A2" },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 20, paddingTop: 12 },
  hint: { fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 8 },
  pickerHeader: { flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 12 },
  pickRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
});

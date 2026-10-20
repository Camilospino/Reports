import { useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, X } from "lucide-react-native";
import { addPhoto, removeLocalPhoto } from "@/lib/actions";
import type { LocalPhoto } from "@/lib/db";
import { colors, fonts } from "@/theme";
import { T } from "./ui";

// Toma una foto con la cámara (o la escoge de la galería) y la guarda comprimida en el celular.
export async function takePhoto(orderId: string, kind: "foto_antes" | "foto_despues") {
  const pick = async (source: "camera" | "library") => {
    const perm =
      source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert("Sin permiso", source === "camera" ? "Activa el permiso de cámara para tomar fotos." : "Activa el permiso de fotos.");
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1, exif: false };
    const result = source === "camera" ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return;
    try {
      await addPhoto(orderId, kind, asset);
    } catch (e) {
      Alert.alert("No se pudo guardar la foto", e instanceof Error ? e.message : String(e));
    }
  };
  Alert.alert(kind === "foto_antes" ? "Foto del antes" : "Foto del después", undefined, [
    { text: "Tomar foto", onPress: () => void pick("camera") },
    { text: "Escoger de la galería", onPress: () => void pick("library") },
    { text: "Cancelar", style: "cancel" },
  ]);
}

// Grid de 4 columnas con cuadros 1:1; el último es el botón de cámara.
export function PhotoGrid({ orderId, photos, kind, editable }: { orderId: string; photos: LocalPhoto[]; kind: "foto_antes" | "foto_despues"; editable: boolean }) {
  const [open, setOpen] = useState<LocalPhoto | null>(null);
  const list = photos.filter((p) => p.kind === kind);
  return (
    <View style={s.grid}>
      {list.map((p, i) => (
        <Pressable
          key={p.id}
          style={s.cell}
          onPress={() => setOpen(p)}
          accessibilityRole="imagebutton"
          accessibilityLabel={`Foto ${i + 1}${p.local ? ", sin subir" : ""}`}
        >
          {p.uri ? <Image source={{ uri: p.uri }} style={s.img} /> : <View style={[s.img, { backgroundColor: colors.lineSoft }]} />}
          {p.local && <View style={s.badge} />}
        </Pressable>
      ))}
      {editable && (
        <Pressable
          style={[s.cell, s.add]}
          onPress={() => void takePhoto(orderId, kind)}
          accessibilityRole="button"
          accessibilityLabel={kind === "foto_antes" ? "Tomar foto del antes" : "Tomar foto del después"}
        >
          <Camera size={24} color={colors.muted} />
        </Pressable>
      )}

      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={s.viewer}>
          {open?.uri && <Image source={{ uri: open.uri }} style={s.full} resizeMode="contain" />}
          <View style={s.viewerBar}>
            <T style={{ color: "#FFFFFF" }}>{open?.local ? "Sin subir todavía" : (open?.caption ?? "")}</T>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {open?.local && editable && (
                <Pressable
                  onPress={() => {
                    if (open && removeLocalPhoto(orderId, open.id)) setOpen(null);
                    else Alert.alert("No se puede quitar", "Esta foto ya se está subiendo.");
                  }}
                  style={s.viewerBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar foto"
                >
                  <T style={{ color: "#FFFFFF", fontFamily: fonts.bodySemibold }}>Quitar</T>
                </Pressable>
              )}
              <Pressable onPress={() => setOpen(null)} style={s.viewerBtn} accessibilityRole="button" accessibilityLabel="Cerrar">
                <X size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: "23%", aspectRatio: 1, borderRadius: 10, overflow: "hidden" },
  img: { width: "100%", height: "100%" },
  add: { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.line, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  badge: { position: "absolute", top: 6, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 2, borderColor: "#FFFFFF" },
  viewer: { flex: 1, backgroundColor: "rgba(16,33,28,0.95)", justifyContent: "center" },
  full: { width: "100%", height: "80%" },
  viewerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  viewerBtn: { minWidth: 44, height: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)" },
});

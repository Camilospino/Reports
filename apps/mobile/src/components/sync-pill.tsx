import { StyleSheet, View } from "react-native";
import { useStore } from "@/lib/store";
import { colors, fonts } from "@/theme";
import { T } from "./ui";

// Pastilla del encabezado: "Sincronizado" o "3 cambios sin subir".
export function SyncPill() {
  const pending = useStore((s) => s.pending);
  const online = useStore((s) => s.online);
  const syncing = useStore((s) => s.syncing);
  const label = pending
    ? `${pending} ${pending === 1 ? "cambio" : "cambios"} sin subir`
    : syncing
      ? "Sincronizando…"
      : online
        ? "Sincronizado"
        : "Sin señal";
  const dot = pending || !online ? colors.accent : colors.online;
  return (
    <View style={s.pill} accessible accessibilityRole="text" accessibilityLabel={`Estado: ${label}`}>
      <View style={[s.dot, { backgroundColor: dot }]} />
      <T style={s.text}>{label}</T>
    </View>
  );
}

const s = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.ink2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bodySemibold },
});

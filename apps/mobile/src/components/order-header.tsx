import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { colors, fonts } from "@/theme";
import { T } from "./ui";

// Encabezado blanco con borde inferior y botón volver de 44 px.
export function OrderHeader({ title, subtitle, step }: { title: string; subtitle: string; step?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: 10 + insets.top }]}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={s.back}
        accessibilityRole="button"
        accessibilityLabel="Volver"
      >
        <ChevronLeft size={24} color={colors.ink} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <T style={s.title} accessibilityRole="header">
          {title}
        </T>
        <T style={s.sub} numberOfLines={1}>
          {subtitle}
        </T>
      </View>
      {step && <T style={s.step}>{step}</T>}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  title: { fontFamily: fonts.display, fontSize: 18 },
  sub: { fontSize: 13, color: colors.muted },
  step: { fontSize: 13, fontFamily: fonts.bodySemibold, color: colors.muted },
});

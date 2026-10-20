import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { STATUS, colors, fonts, type OrderStatus } from "@/theme";

export function T({ style, children, ...rest }: TextProps & { style?: StyleProp<TextStyle>; children: ReactNode }) {
  return (
    <Text {...rest} style={[{ fontFamily: fonts.body, color: colors.ink, fontSize: 14 }, style]}>
      {children}
    </Text>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={s.sectionRow}>
      <T style={s.section}>{children}</T>
      {right}
    </View>
  );
}

export function StatusChip({ status, extra }: { status: OrderStatus; extra?: string }) {
  const c = STATUS[status];
  return (
    <View style={[s.chip, { backgroundColor: c.bg }]}>
      <View style={[s.dot, { backgroundColor: c.fg }]} />
      <T style={[s.chipText, { color: c.fg }]}>
        {c.label}
        {extra ? ` · ${extra}` : ""}
      </T>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "accent" | "primary" | "outline" | "dark";
  icon?: ReactNode;
  iconRight?: ReactNode;
  height?: number;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({ label, onPress, variant = "primary", icon, iconRight, height = 48, disabled, loading, style, accessibilityHint }: ButtonProps) {
  const bg = { accent: colors.accent, primary: colors.primary, dark: colors.ink, outline: colors.surface }[variant];
  const fg = variant === "outline" ? colors.ink : "#FFFFFF";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg, height, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        variant === "outline" && { borderWidth: 1, borderColor: colors.line },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon}
      <T style={[s.buttonText, { color: fg, fontSize: height >= 52 ? 16 : 14 }]}>{label}</T>
      {iconRight}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <View style={[s.fill, { width: `${Math.min(100, Math.max(0, value * 100))}%` }]} />
    </View>
  );
}

const s = StyleSheet.create({
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 10 },
  section: { fontSize: 12, fontFamily: fonts.bodySemibold, color: colors.muted, letterSpacing: 0.5, textTransform: "uppercase" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontFamily: fonts.bodySemibold },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingHorizontal: 16 },
  buttonText: { fontFamily: fonts.bodyBold },
  card: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 16 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.lineSoft, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
});

// Esqueleto de carga: bloques grises que pulsan (quietos si el celular pide reducir movimiento).
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [opacity]);
  return <Animated.View style={[{ backgroundColor: colors.lineSoft, borderRadius: 8 }, style, { opacity }]} />;
}

// Mientras el celular descarga las órdenes por primera vez.
export function FirstSyncSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <View style={{ gap: 10 }}>
      <T accessibilityLiveRegion="polite" style={{ color: colors.muted }}>
        Descargando tus órdenes…
      </T>
      {Array.from({ length: cards }, (_, i) => (
        <View key={i} style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10 }}>
          <Skeleton style={{ height: 12, width: "40%" }} />
          <Skeleton style={{ height: 18, width: "75%" }} />
          <Skeleton style={{ height: 12, width: "55%" }} />
        </View>
      ))}
    </View>
  );
}

import { Pressable, RefreshControl, SectionList, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useStore } from "@/lib/store";
import { sync } from "@/lib/sync";
import { dateKey, longDate, orderCode, time } from "@/lib/format";
import type { LocalOrder } from "@/lib/db";
import { TabHeader } from "@/components/screen-header";
import { SyncPill } from "@/components/sync-pill";
import { FirstSyncSkeleton, StatusChip, T } from "@/components/ui";
import { colors, fonts } from "@/theme";

// Mis órdenes de la semana pasada y la siguiente, agrupadas por día.
export default function Orders() {
  const orders = useStore((s) => s.orders);
  const syncing = useStore((s) => s.syncing);
  const firstSync = useStore((s) => s.lastSync === null);
  const today = dateKey();

  const groups = new Map<string, LocalOrder[]>();
  for (const o of orders) {
    const key = o.scheduled_start ? dateKey(o.scheduled_start) : "sin-fecha";
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  const sections = [...groups.entries()]
    .sort(([a], [b]) => {
      // Primero hoy y lo que viene; después lo pasado (más reciente primero).
      const fa = a >= today ? 0 : 1;
      const fb = b >= today ? 0 : 1;
      return fa - fb || (fa === 0 ? a.localeCompare(b) : b.localeCompare(a));
    })
    .map(([key, data]) => ({
      title: key === "sin-fecha" ? "Sin fecha" : key === today ? `Hoy · ${longDate(data[0]!.scheduled_start!)}` : longDate(data[0]!.scheduled_start!),
      data,
    }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TabHeader title="Órdenes" right={<SyncPill />} />
      <SectionList
        sections={sections}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={() => void sync()} tintColor={colors.primary} />}
        renderSectionHeader={({ section }) => <T style={s.day}>{section.title}</T>}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          firstSync ? (
            <FirstSyncSkeleton />
          ) : (
            <T style={{ color: colors.muted, marginTop: 20 }}>
              No tienes órdenes de la semana pasada ni de la próxima. Cuando la oficina te asigne una, aparece aquí.
            </T>
          )
        }
        renderItem={({ item: o }) => (
          <Pressable
            onPress={() => router.push(`/orden/${o.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`${orderCode(o.number)}, ${o.service ?? o.title}, ${o.customer.name}`}
            style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <T style={s.code}>
                  {orderCode(o.number)} · {time(o.scheduled_start)}
                </T>
                <StatusChip status={o.status} />
              </View>
              <T style={{ fontFamily: fonts.bodySemibold }} numberOfLines={1}>
                {o.service ?? o.title}
              </T>
              <T style={{ fontSize: 13, color: colors.muted }} numberOfLines={1}>
                {o.customer.name}
                {o.site?.neighborhood ? ` · ${o.site.neighborhood}` : ""}
              </T>
            </View>
            <ChevronRight size={20} color={colors.muted} />
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  day: { fontSize: 12, fontFamily: fonts.bodySemibold, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 18, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 14 },
  code: { fontFamily: fonts.display, fontSize: 13, color: colors.muted },
});

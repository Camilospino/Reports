import { useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowRight, ChevronRight, Hand, Navigation, Phone } from "lucide-react-native";
import { useStore } from "@/lib/store";
import { sync } from "@/lib/sync";
import { dateKey, duration, firstName, hours, longDate, orderCode, shortDate, time } from "@/lib/format";
import { takeOrder } from "@/lib/actions";
import { call, currentOrder, directions, durationMs, isToday, upcoming, workedMs } from "@/lib/orders";
import type { AvailableOrder, LocalOrder } from "@/lib/db";
import { SyncPill } from "@/components/sync-pill";
import { Button, Card, FirstSyncSkeleton, ProgressBar, SectionLabel, StatusChip, T } from "@/components/ui";
import { colors, fonts } from "@/theme";

function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export default function Today() {
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const all = useStore((s) => s.orders);
  const available = useStore((s) => s.available);
  const syncing = useStore((s) => s.syncing);
  // Nunca sincronizado: todavía no sabemos si tiene órdenes.
  const firstSync = useStore((s) => s.lastSync === null);
  const now = useNow();

  const today = all.filter((o) => isToday(o) && o.status !== "cancelada");
  const current = currentOrder(all);
  const next = upcoming(today, current?.id);
  const done = today.filter((o) => o.status === "completada").length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={syncing} onRefresh={() => void sync()} tintColor={colors.primary} />}
    >
      <View style={[s.header, { paddingTop: 28 + insets.top }]}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <T style={s.date}>{longDate(new Date(now))}</T>
            <T style={s.hello} numberOfLines={1}>
              Hola, {firstName(profile?.fullName ?? "")}
            </T>
          </View>
          <SyncPill />
        </View>
        <View style={s.stats}>
          <Stat value={String(today.length)} label="Órdenes hoy" />
          <Stat value={String(done)} label="Terminadas" />
          <Stat value={hours(workedMs(today, now))} label="Trabajadas" />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {firstSync && all.length === 0 ? (
          <>
            <SectionLabel>Hoy</SectionLabel>
            <FirstSyncSkeleton />
          </>
        ) : (
        <>
        {available.length > 0 && (
          <>
            <SectionLabel>Disponibles para tomar</SectionLabel>
            <View style={{ gap: 10 }}>
              {available.map((o) => (
                <AvailableCard key={o.id} order={o} />
              ))}
            </View>
          </>
        )}

        <SectionLabel>Ahora</SectionLabel>
        {current ? (
          <CurrentCard order={current} now={now} />
        ) : (
          <Card>
            <T style={{ color: colors.muted }}>
              {next.length ? "No tienes una orden en curso. Empieza la siguiente cuando vayas en camino." : "No tienes órdenes en curso."}
            </T>
          </Card>
        )}

        <SectionLabel>Siguientes</SectionLabel>
        {next.length === 0 ? (
          <Card>
            <T style={{ color: colors.muted }}>{today.length ? "No hay más órdenes para hoy." : "Hoy no tienes órdenes asignadas."}</T>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {next.map((o) => (
              <NextCard key={o.id} order={o} />
            ))}
          </View>
        )}
        </>
        )}
      </View>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <T style={s.statValue}>{value}</T>
      <T style={s.statLabel}>{label}</T>
    </View>
  );
}

function CurrentCard({ order: o, now }: { order: LocalOrder; now: number }) {
  const done = o.checklist.filter((c) => c.done).length;
  const photos = o.photos.filter((p) => p.kind !== "firma").length;
  const since = o.status === "en_proceso" && o.started_at ? duration(now - Date.parse(o.started_at)) : undefined;
  return (
    <View style={s.current}>
      <View style={s.rowBetween}>
        <T style={s.number}>{orderCode(o.number)}</T>
        <StatusChip status={o.status} extra={since} />
      </View>
      <T style={s.currentTitle}>{o.title}</T>
      <T style={{ color: colors.muted, marginTop: 2 }}>
        {o.customer.name}
        {o.site ? ` · ${o.site.address}` : ""}
      </T>
      {o.checklist.length > 0 && (
        <View style={{ marginTop: 14, gap: 6 }}>
          <ProgressBar value={done / o.checklist.length} />
          <T style={{ fontSize: 13, color: colors.muted }}>
            Chequeo {done} de {o.checklist.length} · {photos} {photos === 1 ? "foto" : "fotos"}
          </T>
        </View>
      )}
      <View style={s.grid2}>
        <Button label="Llamar" variant="outline" icon={<Phone size={18} color={colors.ink} />} onPress={() => call(o.customer.phone_whatsapp)} style={{ flex: 1 }} />
        <Button
          label="Cómo llegar"
          variant="outline"
          icon={<Navigation size={18} color={colors.ink} />}
          onPress={() => directions(o)}
          style={{ flex: 1 }}
        />
      </View>
      <Button
        label="Continuar orden"
        variant="accent"
        height={52}
        iconRight={<ArrowRight size={18} color="#FFFFFF" />}
        onPress={() => router.push(`/orden/${o.id}`)}
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

function AvailableCard({ order: o }: { order: AvailableOrder }) {
  const [taking, setTaking] = useState(false);
  const when = o.scheduled_start
    ? `${dateKey(o.scheduled_start) === dateKey() ? "Hoy" : shortDate(o.scheduled_start)} · ${time(o.scheduled_start)}`
    : "Sin fecha";

  async function take() {
    setTaking(true);
    try {
      await takeOrder(o.id);
      router.push(`/orden/${o.id}`);
    } catch (e) {
      Alert.alert("No se pudo tomar la orden", e instanceof Error ? e.message : String(e));
    } finally {
      setTaking(false);
    }
  }

  return (
    <View style={s.available}>
      <View style={s.rowBetween}>
        <T style={s.number}>{orderCode(o.number)}</T>
        <T style={{ fontSize: 13, color: colors.muted }}>{when}</T>
      </View>
      <T style={{ fontFamily: fonts.bodySemibold, marginTop: 6 }} numberOfLines={2}>
        {o.service ?? o.title}
      </T>
      <T style={{ fontSize: 13, color: colors.muted }} numberOfLines={1}>
        {o.customer}
        {o.place ? ` · ${o.place}` : ""}
      </T>
      <Button
        label="Tomar orden"
        variant="accent"
        icon={taking ? undefined : <Hand size={18} color="#FFFFFF" />}
        loading={taking}
        onPress={() => void take()}
        accessibilityHint="Te asigna esta orden. Los demás técnicos dejan de verla."
        style={{ marginTop: 12 }}
      />
    </View>
  );
}

function NextCard({ order: o }: { order: LocalOrder }) {
  return (
    <Pressable
      onPress={() => router.push(`/orden/${o.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${time(o.scheduled_start)}, ${o.service ?? o.title}, ${o.customer.name}`}
      style={({ pressed }) => [s.next, pressed && { opacity: 0.85 }]}
    >
      <View style={{ width: 64 }}>
        <T style={s.nextTime}>{time(o.scheduled_start)}</T>
        <T style={{ fontSize: 12, color: colors.muted }}>{duration(durationMs(o))}</T>
      </View>
      <View style={s.sep} />
      <View style={{ flex: 1 }}>
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
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: colors.ink, paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  date: { fontSize: 13, color: colors.headerMuted },
  hello: { fontFamily: fonts.display, fontSize: 24, color: "#FFFFFF", marginTop: 2 },
  stats: { flexDirection: "row", gap: 10, marginTop: 18 },
  stat: { flex: 1, backgroundColor: colors.ink2, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: "#FFFFFF" },
  statLabel: { fontSize: 12, color: colors.headerMuted },
  current: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 2, borderColor: colors.primary, padding: 16 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  number: { fontFamily: fonts.display, fontSize: 14, color: colors.muted },
  currentTitle: { fontFamily: fonts.display, fontSize: 19, marginTop: 8 },
  grid2: { flexDirection: "row", gap: 10, marginTop: 14 },
  next: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  available: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: "dashed",
    padding: 14,
  },
  nextTime: { fontFamily: fonts.display, fontSize: 18 },
  sep: { width: 1, alignSelf: "stretch", backgroundColor: colors.line },
});

import { useState } from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { useStore } from "@/lib/store";
import { cop } from "@/lib/format";
import { TabHeader } from "@/components/screen-header";
import { Skeleton, T } from "@/components/ui";
import { colors, fonts } from "@/theme";

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Catálogo de materiales de la empresa con su stock (solo lectura).
export default function Inventory() {
  const materials = useStore((s) => s.materials);
  const [q, setQ] = useState("");
  const firstSync = useStore((s) => s.lastSync === null);
  const list = materials.filter((m) => !q || normalize(m.name).includes(normalize(q)));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TabHeader title="Inventario" />
      <View style={s.search}>
        <Search size={18} color={colors.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Buscar material"
          placeholderTextColor={colors.muted}
          style={s.input}
          accessibilityLabel="Buscar material"
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.lineSoft }} />}
        ListEmptyComponent={
          firstSync ? (
            <View style={{ marginTop: 12, gap: 14 }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} style={{ height: 40 }} />
              ))}
            </View>
          ) : (
            <T style={{ color: colors.muted, marginTop: 20 }}>
              {q ? "No hay materiales con ese nombre." : "Tu empresa todavía no tiene materiales en el catálogo. Pídele a la oficina que los agregue."}
            </T>
          )
        }
        renderItem={({ item: m }) => {
          const low = m.stock <= 0;
          return (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: fonts.bodySemibold }}>{m.name}</T>
                <T style={{ fontSize: 12, color: colors.muted }}>
                  {cop(m.unit_price)} / {m.unit}
                </T>
              </View>
              <T style={[s.stock, low && { color: colors.danger }]}>
                {m.stock.toLocaleString("es-CO")} {m.unit}
              </T>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  stock: { fontFamily: fonts.display, fontSize: 15 },
});

import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { LogOut, RefreshCw } from "lucide-react-native";
import { useStore, reload } from "@/lib/store";
import { sync } from "@/lib/sync";
import { supabase } from "@/lib/supabase";
import { clearAll, db } from "@/lib/db";
import { shortDate, time } from "@/lib/format";
import { TabHeader } from "@/components/screen-header";
import { Button, Card, SectionLabel, T } from "@/components/ui";
import { colors, fonts } from "@/theme";

const TYPE_LABELS: Record<string, string> = {
  status: "Cambio de estado",
  checklist: "Lista de chequeo",
  item_add: "Material agregado",
  item_qty: "Cantidad de material",
  item_remove: "Material quitado",
  photo: "Foto",
  complete: "Cierre de la orden",
};

export default function Profile() {
  const profile = useStore((s) => s.profile);
  const pending = useStore((s) => s.pending);
  const failed = useStore((s) => s.failed);
  const lastSync = useStore((s) => s.lastSync);
  const syncing = useStore((s) => s.syncing);
  const online = useStore((s) => s.online);
  const lastError = useStore((s) => s.lastError);

  function signOut() {
    const go = async () => {
      await supabase.auth.signOut().catch(() => {});
      clearAll();
      reload();
    };
    if (pending > 0) {
      Alert.alert(
        "Tienes cambios sin subir",
        `Si cierras sesión ahora se pierden ${pending} ${pending === 1 ? "cambio" : "cambios"}. Conéctate a internet y espera a que se suban.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Cerrar igual", style: "destructive", onPress: go },
        ],
      );
    } else {
      void go();
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TabHeader title="Perfil" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Card>
          <T style={{ fontFamily: fonts.display, fontSize: 19 }}>{profile?.fullName}</T>
          <T style={{ color: colors.muted, marginTop: 2 }}>Técnico · {profile?.companyName}</T>
        </Card>

        <SectionLabel>Sincronización</SectionLabel>
        <Card style={{ gap: 6 }}>
          <T>
            {!online ? "Sin señal. " : ""}
            {pending ? `${pending} ${pending === 1 ? "cambio" : "cambios"} sin subir.` : "Todo está subido."}
          </T>
          <T style={{ fontSize: 13, color: colors.muted }}>
            {lastSync ? `Última sincronización: ${shortDate(lastSync)}, ${time(lastSync)}` : "Aún no se ha sincronizado."}
          </T>
          {pending > 0 && lastError && <T style={{ fontSize: 13, color: colors.muted }}>Último intento: {lastError}</T>}
          <Button
            label="Sincronizar ahora"
            variant="outline"
            icon={<RefreshCw size={18} color={colors.ink} />}
            loading={syncing}
            onPress={() => {
              db.runSync("UPDATE queue SET next_try_at = 0 WHERE failed = 0");
              void sync();
            }}
            style={{ marginTop: 8 }}
          />
        </Card>

        {failed.length > 0 && (
          <>
            <SectionLabel>No se pudieron subir</SectionLabel>
            <Card style={{ gap: 10, borderColor: colors.dangerSoft }}>
              <T style={{ fontSize: 13, color: colors.muted }}>
                El servidor rechazó estos cambios (por ejemplo, porque la orden ya estaba cerrada o te la reasignaron). Avísale al despachador.
              </T>
              {failed.map((f) => (
                <View key={f.id} style={s.failed}>
                  <T style={{ fontFamily: fonts.bodySemibold }}>{TYPE_LABELS[f.type] ?? f.type}</T>
                  <T style={{ fontSize: 13, color: colors.danger }}>{f.last_error}</T>
                </View>
              ))}
              <Button
                label="Descartar estos cambios"
                variant="outline"
                onPress={() =>
                  Alert.alert("Descartar cambios", "Se borran del celular y no se subirán.", [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Descartar",
                      style: "destructive",
                      onPress: () => {
                        db.runSync("DELETE FROM queue WHERE failed = 1");
                        reload();
                        void sync();
                      },
                    },
                  ])
                }
              />
            </Card>
          </>
        )}

        <Button
          label="Cerrar sesión"
          variant="outline"
          icon={<LogOut size={18} color={colors.ink} />}
          onPress={signOut}
          style={{ marginTop: 28 }}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  failed: { borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 8 },
});

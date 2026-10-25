import { useState } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, Wrench } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { clearAll, getMeta, setMeta, type Profile } from "@/lib/db";
import { reload } from "@/lib/store";
import { Button, T } from "@/components/ui";
import { colors, fonts } from "@/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) return setError("Escribe tu correo y tu contraseña.");
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError || !data.user) {
        return setError(
          /network|fetch/i.test(authError?.message ?? "")
            ? "No hay conexión. Para entrar la primera vez necesitas señal."
            : "Correo o contraseña incorrectos.",
        );
      }
      // Solo técnicos activos. El dueño y el despachador usan el panel web.
      const { data: m } = await supabase
        .from("memberships")
        .select("id, company_id, full_name, companies(name)")
        .eq("user_id", data.user.id)
        .eq("role", "technician")
        .eq("active", true)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (!m) {
        await supabase.auth.signOut();
        return setError("Esta app es para técnicos. Si eres dueño o despachador, entra al panel web.");
      }
      const profile: Profile = {
        userId: data.user.id,
        membershipId: m.id,
        companyId: m.company_id,
        companyName: m.companies?.name ?? "",
        fullName: m.full_name,
      };
      // Mismo técnico que antes: se conservan sus órdenes y los cambios sin subir.
      if (getMeta<string>("lastUserId") !== profile.userId) clearAll();
      setMeta("profile", profile);
      setMeta("lastUserId", profile.userId);
      reload(); // el layout ve el perfil, abre "Mi día" y arranca la sincronización
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* "padding" también en Android: con la pantalla de borde a borde (Android 15+) el teclado ya no
          encoge la ventana, y sin esto tapaba el campo de la contraseña. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
          <View style={s.brand}>
            <View style={s.logo}>
              <Wrench size={20} color="#FFFFFF" strokeWidth={2} />
            </View>
            <T style={s.brandText}>tecnio</T>
          </View>
          <View style={s.card}>
            <T style={s.title}>Entra a tu día</T>
            <T style={s.sub}>Usa el correo y la contraseña que te dio tu empresa.</T>
            <T style={s.label}>Correo</T>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="tu@empresa.com"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Correo"
            />
            <T style={s.label}>Contraseña</T>
            <View>
              <TextInput
                style={[s.input, s.passwordInput]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                placeholder="Tu contraseña"
                placeholderTextColor={colors.muted}
                accessibilityLabel="Contraseña"
                onSubmitEditing={submit}
              />
              {/* Ojito para ver lo que se escribe (en la calle es fácil equivocarse con el teclado). */}
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={s.eye}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} color={colors.muted} /> : <Eye size={20} color={colors.muted} />}
              </Pressable>
            </View>
            {error && (
              <T style={s.error} accessibilityRole="alert">
                {error}
              </T>
            )}
            <Button label="Entrar" onPress={submit} loading={loading} height={52} style={{ marginTop: 18 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: "center", padding: 20 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "center", marginBottom: 24 },
  logo: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  brandText: { fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  card: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 20 },
  title: { fontFamily: fonts.display, fontSize: 22 },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 8 },
  label: { fontFamily: fonts.bodyMedium, marginTop: 14, marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  passwordInput: { paddingRight: 52 },
  eye: { position: "absolute", right: 0, top: 0, width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  error: { color: colors.danger, marginTop: 12 },
});

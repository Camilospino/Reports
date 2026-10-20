import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
} from "@expo-google-fonts/ibm-plex-sans";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Sentry, identify } from "@/lib/sentry";
import { reload, useStore } from "@/lib/store";
import { startSyncLoop } from "@/lib/sync";
import { colors } from "@/theme";

void SplashScreen.preventAutoHideAsync();
reload(); // lee la copia local antes de pintar: la app abre sin señal

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });
  const userId = useStore((s) => s.profile?.userId);
  // Si las fuentes no cargan, la app sigue con la fuente del sistema en vez de quedarse en la pantalla de inicio.
  const loaded = fontsLoaded || !!fontError;

  useEffect(() => {
    if (fontError) console.warn("No se pudieron cargar las fuentes", fontError);
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded, fontError]);

  // Sincroniza mientras haya una sesión de técnico.
  useEffect(() => (userId ? startSyncLoop() : undefined), [userId]);
  useEffect(() => identify(userId ?? null), [userId]);

  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!!userId}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="orden/[id]/index" />
          <Stack.Screen name="orden/[id]/cerrar" />
        </Stack.Protected>
        <Stack.Protected guard={!userId}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);

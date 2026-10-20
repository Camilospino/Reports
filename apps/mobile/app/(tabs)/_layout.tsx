import { Tabs } from "expo-router";
import { ClipboardList, Home, Package, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: fonts.bodySemibold },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Hoy", tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={1.8} /> }} />
      <Tabs.Screen
        name="ordenes"
        options={{ title: "Órdenes", tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} strokeWidth={1.8} /> }}
      />
      <Tabs.Screen
        name="inventario"
        options={{ title: "Inventario", tabBarIcon: ({ color }) => <Package size={22} color={color} strokeWidth={1.8} /> }}
      />
      <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={1.8} /> }} />
    </Tabs>
  );
}

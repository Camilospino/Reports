import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import LegacyStorage from "expo-sqlite/kv-store";
import type { Database } from "@tecnio/db";
import { sessionStorage } from "@/lib/db";

// Solo la clave pública (anon). La seguridad la pone la RLS; nunca la service_role en el celular.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error("Faltan EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en apps/mobile/.env");

// La sesión vive en la base local cifrada. Si viene de una versión anterior (kv-store, sin cifrar),
// se mueve la primera vez que se lee: el técnico no tiene que volver a entrar.
const storage = {
  getItem(key: string) {
    const value = sessionStorage.getItem(key);
    if (value !== null) return value;
    const legacy = LegacyStorage.getItemSync(key);
    if (legacy !== null) {
      sessionStorage.setItem(key, legacy);
      LegacyStorage.removeItemSync(key);
    }
    return legacy;
  },
  setItem: sessionStorage.setItem,
  removeItem(key: string) {
    sessionStorage.removeItem(key);
    LegacyStorage.removeItemSync(key);
  },
};

export const supabase = createClient<Database>(url, anonKey, {
  auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

// Refresca el token solo con la app abierta.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? "http://localhost:4000").replace(/\/$/, "");

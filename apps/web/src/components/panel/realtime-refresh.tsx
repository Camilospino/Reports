"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Vuelve a cargar los datos del servidor cuando cambia una orden de la empresa (u otra tabla
// de `tables`; Supabase Realtime respeta la RLS) y cada minuto, para que "lleva 1 h 10 min" avance.
export function RealtimeRefresh({ companyId, tables = ["work_orders"] }: { companyId: string; tables?: string[] }) {
  const router = useRouter();
  const key = tables.join(",");

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 300);
    };

    // Hay que suscribirse con el token del usuario: como anónimo no hay permisos y Realtime rechaza la suscripción.
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session) return;
      await supabase.realtime.setAuth(session.access_token);
      channel = supabase.channel(`${key}:${companyId}`);
      for (const table of key.split(",")) {
        channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `company_id=eq.${companyId}` }, refresh);
      }
      channel.subscribe();
    });
    const interval = setInterval(() => router.refresh(), 60_000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [companyId, key, router]);

  return null;
}

import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@tecnio/db";

// Cliente con la llave secreta: salta RLS. Solo para acciones de servidor que ya
// verificaron el rol del usuario (por ejemplo, invitar a alguien al equipo).
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

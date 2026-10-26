import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@tecnio/db";
import type { MemberRole } from "@/lib/format";
import { INSTALLATION_BUCKET } from "@/lib/installations";

// Todo lo que muestra el detalle de una instalación. null si no existe o es de otra empresa.
export async function loadInstallation(
  supabase: SupabaseClient<Database>,
  companyId: string,
  id: string,
  role: MemberRole,
) {
  const [installation, assets, orders, credentials, files] = await Promise.all([
    supabase
      .from("installations")
      .select(
        "id, number, name, system_type, installed_on, warranty_until, maintenance_every_months, last_maintenance, next_maintenance, status, notes, customer_id, site_id, origin_work_order_id, customers(id, name, contact_name, phone_whatsapp), sites(address, neighborhood, city), installer:memberships!installations_company_id_installed_by_fkey(full_name), origin:work_orders!installations_company_id_origin_work_order_id_fkey(id, number)",
      )
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("assets")
      .select("id, name, type, category, brand, model, serial, location, status, photo_path")
      .eq("installation_id", id)
      .eq("company_id", companyId)
      .order("name"),
    supabase
      .from("work_orders")
      .select("id, number, title, description, status, scheduled_start, completed_at, created_at, signer_name, service_types(name), memberships(full_name), attachments(kind)")
      .eq("installation_id", id)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false }),
    // La RLS solo deja ver los accesos al dueño (y al técnico con orden abierta, en la app).
    supabase.from("installation_credentials").select("id, label, host, username").eq("installation_id", id).order("created_at"),
    supabase.from("installation_files").select("id, kind, storage_path, created_at").eq("installation_id", id).order("created_at"),
  ]);
  if (!installation.data) return null;

  // Una sola firma para fotos de equipos, plano y fotos del sitio.
  const paths = [
    ...(files.data ?? []).map((f) => f.storage_path),
    ...(assets.data ?? []).flatMap((a) => (a.photo_path ? [a.photo_path] : [])),
  ];
  const signed = paths.length ? ((await supabase.storage.from(INSTALLATION_BUCKET).createSignedUrls(paths, 3600)).data ?? []) : [];
  const urlOf = (path: string | null) => (path ? (signed.find((s) => s.path === path)?.signedUrl ?? null) : null);

  return {
    installation: installation.data,
    assets: (assets.data ?? []).map((a) => ({ ...a, photo_url: urlOf(a.photo_path) })),
    orders: orders.data ?? [],
    canSeeCredentials: role === "owner",
    credentials: credentials.data ?? [],
    files: (files.data ?? []).flatMap((f) => {
      const url = urlOf(f.storage_path);
      return url ? [{ id: f.id, kind: f.kind as "plano" | "foto", url }] : [];
    }),
  };
}

export type InstallationDetail = NonNullable<Awaited<ReturnType<typeof loadInstallation>>>;
export type InstallationAsset = InstallationDetail["assets"][number];

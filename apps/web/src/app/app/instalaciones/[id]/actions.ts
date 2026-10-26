"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/session";
import { optionalText, requiredText } from "@/lib/forms";
import { INSTALLATION_BUCKET } from "@/lib/installations";

type Result = { error?: string };

const id = z.guid();
const path = (installationId: string) => `/app/instalaciones/${installationId}`;

// Errores de la base de datos que el usuario puede entender.
function dbError(error: { code?: string; message: string } | null, fallback: string): Result {
  if (!error) return {};
  if (error.code === "42501" || error.code === "23514") return { error: error.message };
  return { error: fallback };
}

// La instalación tiene que ser de la empresa actual.
async function installationOf(installationId: string) {
  const session = await requireStaff();
  if (!id.safeParse(installationId).success) return { ...session, installation: null };
  const { data } = await session.supabase
    .from("installations")
    .select("id, site_id")
    .eq("id", installationId)
    .eq("company_id", session.company.id)
    .maybeSingle();
  return { ...session, installation: data };
}

// --- Equipos ----------------------------------------------------------------
const assetSchema = z.object({
  name: requiredText(1, 80, "Escribe el nombre del equipo."),
  type: requiredText(1, 60, "Escribe el tipo de equipo."),
  category: requiredText(1, 40, "Escoge o escribe un grupo."),
  brand: optionalText(60),
  model: optionalText(60),
  serial: optionalText(60),
  location: optionalText(80),
  status: z.enum(["funcionando", "con_falla", "retirado"]),
  // Ruta en Storage de una foto nueva, "" para quitarla o sin valor para dejar la que hay.
  photo_path: z.string().optional(),
});

export async function saveAsset(installationId: string, assetId: string | null, input: z.input<typeof assetSchema>): Promise<Result> {
  const { supabase, company, installation } = await installationOf(installationId);
  if (!installation || (assetId && !id.safeParse(assetId).success)) return { error: "No encontramos la instalación." };
  const parsed = assetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const { photo_path, ...fields } = parsed.data;
  if (photo_path && !photo_path.startsWith(`${company.id}/${installationId}/`)) return { error: "Ruta de archivo inválida." };

  const photo = photo_path === undefined ? {} : { photo_path: photo_path || null };
  let previous: string | null = null;
  let error;
  if (assetId) {
    const { data: old } = await supabase.from("assets").select("photo_path").eq("id", assetId).eq("installation_id", installationId).maybeSingle();
    if (!old) return { error: "No encontramos el equipo." };
    previous = old.photo_path;
    ({ error } = await supabase
      .from("assets")
      .update({ ...fields, ...photo })
      .eq("id", assetId)
      .eq("installation_id", installationId)
      .eq("company_id", company.id));
  } else {
    ({ error } = await supabase
      .from("assets")
      .insert({ company_id: company.id, site_id: installation.site_id, installation_id: installationId, ...fields, ...photo }));
  }
  if (error) return dbError(error, "No pudimos guardar el equipo. Intenta de nuevo.");

  // La foto anterior ya no la usa nadie.
  if (previous && photo_path !== undefined && previous !== photo_path) {
    await supabase.storage.from(INSTALLATION_BUCKET).remove([previous]);
  }
  revalidatePath(path(installationId));
  return {};
}

// --- Plano y fotos del sitio ------------------------------------------------
export async function addInstallationFile(installationId: string, kind: "plano" | "foto", storagePath: string): Promise<Result> {
  const { supabase, company, installation } = await installationOf(installationId);
  if (!installation || !["plano", "foto"].includes(kind)) return { error: "Datos inválidos." };
  if (!storagePath.startsWith(`${company.id}/${installationId}/`) || storagePath.includes("..")) return { error: "Ruta de archivo inválida." };

  // Hay un solo plano: el nuevo reemplaza al anterior.
  const old =
    kind === "plano"
      ? ((await supabase.from("installation_files").select("id, storage_path").eq("installation_id", installationId).eq("kind", "plano")).data ?? [])
      : [];
  const { error } = await supabase
    .from("installation_files")
    .insert({ company_id: company.id, installation_id: installationId, kind, storage_path: storagePath });
  if (error) return dbError(error, "No pudimos guardar el archivo.");
  if (old.length) {
    await supabase.from("installation_files").delete().in("id", old.map((f) => f.id));
    await supabase.storage.from(INSTALLATION_BUCKET).remove(old.map((f) => f.storage_path));
  }
  revalidatePath(path(installationId));
  return {};
}

export async function deleteInstallationFile(installationId: string, fileId: string): Promise<Result> {
  const { supabase, installation } = await installationOf(installationId);
  if (!installation || !id.safeParse(fileId).success) return { error: "Datos inválidos." };
  const { data, error } = await supabase
    .from("installation_files")
    .delete()
    .eq("id", fileId)
    .eq("installation_id", installationId)
    .select("storage_path")
    .maybeSingle();
  if (error || !data) return dbError(error, "No pudimos quitar el archivo.");
  await supabase.storage.from(INSTALLATION_BUCKET).remove([data.storage_path]);
  revalidatePath(path(installationId));
  return {};
}

// --- Accesos técnicos -------------------------------------------------------
// La base revisa el permiso, descifra la contraseña y deja el registro de la vista.
export async function revealPassword(credentialId: string): Promise<{ password?: string; error?: string }> {
  const { supabase } = await requireStaff();
  if (!id.safeParse(credentialId).success) return { error: "Datos inválidos." };
  const { data, error } = await supabase.rpc("reveal_installation_password", { p_credential: credentialId });
  if (error) return { error: error.code === "42501" ? error.message : "No pudimos mostrar la contraseña." };
  return { password: data ?? "" };
}

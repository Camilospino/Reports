import { createClient } from "@/lib/supabase/client";
import { INSTALLATION_BUCKET } from "@/lib/installations";

const MAX_MB = 10;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

// Sube una imagen al bucket de la instalación y devuelve su ruta, o un error para mostrar.
export async function uploadInstallationImage(
  companyId: string,
  installationId: string,
  file: File,
  folder: "equipos" | "sitio",
): Promise<{ path: string } | { error: string }> {
  if (!TYPES.includes(file.type)) return { error: "La imagen debe ser JPG, PNG o WebP." };
  if (file.size > MAX_MB * 1024 * 1024) return { error: `La imagen pesa más de ${MAX_MB} MB.` };
  const ext = file.type.split("/")[1]!.replace("jpeg", "jpg");
  const path = `${companyId}/${installationId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await createClient().storage.from(INSTALLATION_BUCKET).upload(path, file, { contentType: file.type });
  if (error) return { error: "No se pudo subir la imagen. Revisa tu conexión e intenta de nuevo." };
  return { path };
}

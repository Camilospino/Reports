"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, type FormState } from "@/lib/format";

const inviteSchema = z.object({
  full_name: z.string().trim().min(2, "Escribe el nombre."),
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  phone: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? normalizePhone(v) : null)),
  role: z.enum(["dispatcher", "technician"]),
  skills: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
});

// El dueño invita por correo. Si la persona ya tiene cuenta en Tecnio (por ejemplo,
// trabaja con otra empresa), solo se le agrega la membership.
// La llave secreta se usa únicamente aquí, en el servidor, después de verificar que es el dueño.
export async function inviteMember(_: FormState, fd: FormData): Promise<FormState> {
  const { company } = await requireOwner();
  const parsed = inviteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const admin = createAdminClient();
  const origin = (await headers()).get("origin") ?? "";
  let userId: string | null = null;
  let invited = true;

  const { data, error } = await admin.auth.admin.inviteUserByEmail(v.email, {
    data: { full_name: v.full_name },
    redirectTo: `${origin}/crear-contrasena`,
  });
  if (data?.user) {
    userId = data.user.id;
  } else if (error?.code === "email_exists" || error?.status === 422) {
    const { data: existing } = await admin.rpc("find_user_id_by_email", { p_email: v.email });
    userId = existing ?? null;
    invited = false;
  }
  if (!userId) return { error: "No pudimos enviar la invitación. Intenta de nuevo." };

  const { error: membershipError } = await admin.from("memberships").insert({
    user_id: userId,
    company_id: company.id,
    role: v.role,
    full_name: v.full_name,
    phone: v.phone,
    skills: v.skills,
  });
  if (membershipError) {
    if (membershipError.code === "23505") return { error: "Esa persona ya está en tu equipo." };
    return { error: "No pudimos agregar a la persona." };
  }

  revalidatePath("/app/ajustes/equipo");
  return {
    ok: true,
    message: invited
      ? `Listo. Le enviamos a ${v.email} un correo para crear su contraseña.`
      : `Listo. ${v.full_name} ya tenía cuenta en Tecnio; entra con su correo y contraseña de siempre.`,
  };
}

// Activar o desactivar con la sesión del dueño: así aplican la RLS y las reglas de la base.
export async function toggleMember(fd: FormData) {
  const { supabase, company } = await requireOwner();
  await supabase
    .from("memberships")
    .update({ active: fd.get("active") === "true" })
    .eq("id", String(fd.get("id")))
    .eq("company_id", company.id);
  revalidatePath("/app/ajustes/equipo");
}

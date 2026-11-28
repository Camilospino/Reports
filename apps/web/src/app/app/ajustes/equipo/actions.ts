"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/format";

const password = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña es muy larga.");

const memberSchema = z.object({
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
  password,
});

// Lo que el dueño necesita para pasarle el acceso a la persona (por WhatsApp o en persona).
export type Credentials = {
  name: string;
  email: string;
  password: string | null;
  phone: string | null;
  role: "dispatcher" | "technician";
};
export type MemberState = {
  error?: string;
  ok?: boolean;
  message?: string;
  credentials?: Credentials;
} | null;

// El dueño crea la cuenta con una contraseña temporal: la persona entra de una vez, sin esperar correos
// (el correo gratis de Supabase casi no llega). Al primer ingreso se le pide cambiarla
// (user_metadata.must_change_password), así el dueño no se queda sabiendo su clave.
// Si el correo ya tiene cuenta en Tecnio (trabaja con otra empresa), NO se le toca la contraseña:
// solo se agrega la membership y entra con la suya de siempre.
// La llave secreta se usa únicamente aquí, en el servidor, después de verificar que es el dueño.
export async function addMember(_: MemberState, fd: FormData): Promise<MemberState> {
  const { company } = await requireOwner();
  const parsed = memberSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const admin = createAdminClient();
  let userId: string | null = null;
  let created = true;

  const { data, error } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.full_name, must_change_password: true },
  });
  if (data?.user) {
    userId = data.user.id;
  } else if (error?.code === "email_exists" || error?.status === 422) {
    const { data: existing } = await admin.rpc("find_user_id_by_email", {
      p_email: v.email,
    });
    userId = existing ?? null;
    created = false;
  } else if (error?.code === "weak_password") {
    return { error: "Esa contraseña es muy fácil de adivinar. Usa otra." };
  }
  if (!userId) return { error: "No pudimos crear la cuenta. Intenta de nuevo." };

  const { error: membershipError } = await admin.from("memberships").insert({
    user_id: userId,
    company_id: company.id,
    role: v.role,
    full_name: v.full_name,
    phone: v.phone,
    skills: v.skills,
  });
  if (membershipError) {
    // La cuenta recién creada sin empresa no sirve para nada: se borra para poder intentar de nuevo.
    if (created) await admin.auth.admin.deleteUser(userId);
    if (membershipError.code === "23505") return { error: "Esa persona ya está en tu equipo." };
    // Límite de técnicos del plan (lo hace cumplir la base de datos).
    if (membershipError.code === "P0001") return { error: membershipError.message };
    return { error: "No pudimos agregar a la persona." };
  }

  revalidatePath("/app/ajustes/equipo");
  return {
    ok: true,
    message: created
      ? `Listo. ${v.full_name} ya puede entrar. Pásale sus datos de acceso.`
      : `Listo. ${v.full_name} ya tenía cuenta en Tecnio: entra con su correo y su contraseña de siempre.`,
    credentials: {
      name: v.full_name,
      email: v.email,
      password: created ? v.password : null,
      phone: v.phone,
      role: v.role,
    },
  };
}

// El dueño le pone una contraseña nueva a alguien de su equipo (se le olvidó o nunca la tuvo).
// Solo si esa cuenta es únicamente de esta empresa: si la persona también trabaja con otra,
// cambiarle la clave le daría a este dueño acceso a los datos de la otra empresa.
export async function resetMemberPassword(_: MemberState, fd: FormData): Promise<MemberState> {
  const { company, membership: me } = await requireOwner();
  const parsed = z.object({ id: z.string().uuid(), password }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("memberships")
    .select("id, user_id, role, full_name, phone")
    .eq("id", parsed.data.id)
    .eq("company_id", company.id)
    .maybeSingle();
  if (!target) return { error: "No encontramos a esa persona en tu equipo." };
  if (target.id === me.id || target.role === "owner")
    return {
      error: "Tu propia contraseña la cambias en “Olvidé mi contraseña”.",
    };

  const { count } = await admin
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", target.user_id)
    .neq("company_id", company.id);
  if (count !== 0)
    return {
      error: `${target.full_name} también trabaja con otra empresa en Tecnio, así que su contraseña no se puede cambiar desde aquí. Que use “Olvidé mi contraseña”.`,
    };

  const { data: user } = await admin.auth.admin.getUserById(target.user_id);
  if (!user?.user?.email) return { error: "No pudimos cambiar la contraseña. Intenta de nuevo." };

  const { error } = await admin.auth.admin.updateUserById(target.user_id, {
    password: parsed.data.password,
    user_metadata: { ...user.user.user_metadata, must_change_password: true },
  });
  if (error?.code === "weak_password") return { error: "Esa contraseña es muy fácil de adivinar. Usa otra." };
  if (error) return { error: "No pudimos cambiar la contraseña. Intenta de nuevo." };

  return {
    ok: true,
    message: `Listo. ${target.full_name} ya puede entrar con la contraseña nueva.`,
    credentials: {
      name: target.full_name,
      email: user.user.email,
      password: parsed.data.password,
      phone: target.phone,
      role: target.role,
    },
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

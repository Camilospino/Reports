"use server";

import { siteUrl } from "@/lib/messages";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { readInvite } from "@/lib/invite";
import { normalizePhone, type FormState } from "@/lib/format";

const email = z.string().trim().toLowerCase().email("Escribe un correo válido.");
const password = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.");
const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Revisa los datos.";

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ email, password: z.string().min(1, "Escribe tu contraseña.") }).safeParse({
    email: fd.get("email"),
    password: fd.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Si Supabase exige confirmar el correo, decirlo: "contraseña incorrecta" haría que la persona la cambie sin motivo.
  if (error?.code === "email_not_confirmed")
    return { error: "Tu correo aún no está confirmado. Abre el enlace que te enviamos por correo." };
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect("/app");
}

const companySchema = z.object({
  full_name: z.string().trim().min(2, "Escribe tu nombre."),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((p) => p.length >= 12, "Escribe un celular de 10 dígitos."),
  company_name: z.string().trim().min(2, "Escribe el nombre de la empresa."),
  nit: z.string().trim().optional(),
});

// Registro cerrado (enable_signup = false en Supabase): solo con un enlace de invitación.
// La cuenta la crea el servidor con la llave secreta, para el correo que trae la invitación.
export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const invite = readInvite(String(fd.get("invitacion") ?? ""));
  if (!invite) return { error: "La invitación no es válida o ya venció. Pide un enlace nuevo." };
  const parsed = companySchema.extend({ password }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { password: userPassword, ...company } = parsed.data;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: invite.email,
    password: userPassword,
    // El correo lo eligió quien envió la invitación, así que no hace falta confirmarlo.
    email_confirm: true,
    user_metadata: company,
  });
  if (error) {
    if (error.code === "weak_password") return { error: "Esa contraseña es muy débil. Usa una más larga." };
    if (error.code === "email_exists") return { error: "Ese correo ya tiene una cuenta. Inicia sesión." };
    return { error: "No pudimos crear la cuenta. Intenta de nuevo." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: invite.email, password: userPassword });
  if (signInError) redirect("/login");

  const { error: companyError } = await supabase.rpc("create_company", {
    p_company_name: company.company_name,
    p_full_name: company.full_name,
    p_nit: company.nit || undefined,
    p_phone: company.phone,
  });
  // Si falla, el onboarding permite reintentar con los datos ya guardados.
  redirect(companyError ? "/onboarding" : "/app");
}

export async function createCompany(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = companySchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_company", {
    p_company_name: parsed.data.company_name,
    p_full_name: parsed.data.full_name,
    p_nit: parsed.data.nit || undefined,
    p_phone: parsed.data.phone,
  });
  if (error) return { error: "No pudimos crear la empresa. Intenta de nuevo." };
  redirect("/app");
}

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = email.safeParse(fd.get("email"));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  // Nunca la cabecera Origin (la controla quien hace la petición): el enlace del correo llevaría a otro dominio.
  const origin = await siteUrl();
  await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${origin}/crear-contrasena` });
  // Misma respuesta exista o no la cuenta, para no revelar qué correos están registrados.
  return { message: "Si ese correo tiene cuenta, te llegará un enlace para crear una nueva contraseña." };
}

export async function setPassword(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, "Las contraseñas no coinciden.")
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { error: "Usa una contraseña distinta a la anterior." };
    return { error: "No pudimos guardar la contraseña. Pide un enlace nuevo." };
  }
  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

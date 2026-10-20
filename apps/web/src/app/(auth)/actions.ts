"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = companySchema.extend({ email, password }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { email: userEmail, password: userPassword, ...company } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: userEmail,
    password: userPassword,
    // Se guardan en el usuario por si hay que confirmar el correo antes de crear la empresa.
    options: { data: company },
  });
  if (error) {
    if (error.code === "user_already_exists") return { error: "Ese correo ya tiene una cuenta. Inicia sesión." };
    if (error.code === "weak_password") return { error: "Esa contraseña es muy débil. Usa una más larga." };
    return { error: "No pudimos crear la cuenta. Intenta de nuevo." };
  }
  if (!data.session) {
    return { message: "Te enviamos un correo para confirmar tu cuenta. Ábrelo para continuar." };
  }

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
  const origin = (await headers()).get("origin") ?? "";
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

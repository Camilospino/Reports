"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isReportToken } from "@/lib/report";

// El cliente final califica sin cuenta: las funciones de la base validan el token
// y guardan una sola calificación (y un solo comentario) por orden.

export async function rateReport(token: string, stars: number): Promise<{ stars?: number; error?: string }> {
  const parsed = z.number().int().min(1).max(5).safeParse(stars);
  if (!isReportToken(token) || !parsed.success) return { error: "No pudimos guardar tu calificación." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rate_report", { p_token: token, p_stars: parsed.data });
  if (error || !data) return { error: "No pudimos guardar tu calificación. Intenta de nuevo." };
  return { stars: data };
}

export async function commentReport(token: string, comment: string): Promise<{ ok?: boolean; error?: string }> {
  const parsed = z.string().trim().min(1, "Escribe tu comentario.").max(500, "Máximo 500 caracteres.").safeParse(comment);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (!isReportToken(token)) return { error: "No pudimos guardar tu comentario." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("comment_report", { p_token: token, p_comment: parsed.data });
  if (error) return { error: "No pudimos guardar tu comentario. Intenta de nuevo." };
  if (!data) return { error: "Ya habíamos recibido tu comentario. ¡Gracias!" };
  return { ok: true };
}

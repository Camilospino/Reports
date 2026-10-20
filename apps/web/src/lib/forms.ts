import { z } from "zod";
import { normalizePhone, parseCoordinates } from "@/lib/format";

// Piezas de validación que comparten los formularios del panel.

// Texto opcional: vacío → null.
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => v || null);

export const requiredText = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, `Máximo ${max} caracteres.`);

// Celular colombiano o número internacional → "573001112233".
export const optionalPhone = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? normalizePhone(v) : null))
  .refine((v) => v === null || /^\d{10,15}$/.test(v), "Revisa el celular: 10 dígitos, por ejemplo 300 111 2233.");

export const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((v) => v || null)
  .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Revisa el correo.");

// "120.000", "120000" o "2,5" → número.
export const decimal = (message: string) =>
  z
    .string()
    .trim()
    .transform((raw) => {
      const v = raw.replace(/[\s$]/g, "");
      if (/,\d+$/.test(v)) return v.replace(/\./g, "").replace(",", "."); // 1.250,5
      if (/^\d{1,3}(\.\d{3})+$/.test(v)) return v.replace(/\./g, ""); // 120.000
      return v; // 120000 o 2.5
    })
    .refine((v) => v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0, message)
    .transform(Number);

// Enlace de Google Maps o "4.65, -74.06" → coordenadas (o null si está vacío).
export const optionalLocation = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null)
  .refine(
    (v) => v === null || parseCoordinates(v) !== null,
    "No encontramos coordenadas en ese enlace. Pega el enlace largo de Google Maps o algo como 4.65, -74.06.",
  )
  .transform((v) => (v ? parseCoordinates(v) : null));

export const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Revisa los datos.";

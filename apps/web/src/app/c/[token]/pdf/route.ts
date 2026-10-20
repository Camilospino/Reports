import { createClient } from "@/lib/supabase/server";
import { quotePdfResponse, type QuotePdfData } from "@/lib/quote-pdf";

// PDF público de la cotización (enlace que recibe el cliente). Solo vía public_quote().
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{32}$/.test(token)) return new Response("No encontrada", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_quote", { p_token: token });
  if (!data) return new Response("No encontrada", { status: 404 });
  return quotePdfResponse(data as unknown as QuotePdfData);
}

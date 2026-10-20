import { createClient } from "@/lib/supabase/server";
import { quotePdfResponse } from "@/lib/quote-pdf";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PDF de la cotización para el panel. La RLS decide si el usuario la puede ver.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("No encontrada", { status: 404 });
  const supabase = await createClient();
  const { data: q } = await supabase
    .from("quotes")
    .select("number, created_at, valid_until, notes, items, total, customers(name, contact_name), companies(name, nit, phone, logo_url)")
    .eq("id", id)
    .maybeSingle();
  if (!q?.customers || !q.companies) return new Response("No encontrada", { status: 404 });
  return quotePdfResponse({ ...q, customer: q.customers, company: q.companies });
}

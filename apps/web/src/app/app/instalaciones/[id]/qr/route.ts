import { createClient } from "@/lib/supabase/server";
import { UUID_RE } from "@/lib/format";
import { siteUrl } from "@/lib/messages";
import { qrLabelsPdfResponse } from "@/lib/qr-labels-pdf";

// PDF con una etiqueta QR por equipo (sin los retirados). La RLS decide si el usuario la puede ver.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return new Response("No encontrada", { status: 404 });
  const supabase = await createClient();
  const [{ data: ins }, { data: assets }] = await Promise.all([
    supabase.from("installations").select("number, name, companies(name)").eq("id", id).maybeSingle(),
    supabase.from("assets").select("id, name, type").eq("installation_id", id).neq("status", "retirado").order("name"),
  ]);
  if (!ins?.companies) return new Response("No encontrada", { status: 404 });
  const base = await siteUrl();
  return qrLabelsPdfResponse({
    company: ins.companies.name,
    installation: ins,
    labels: (assets ?? []).map((a) => ({ name: a.name ?? a.type, url: `${base}/e/${a.id}` })),
  });
}

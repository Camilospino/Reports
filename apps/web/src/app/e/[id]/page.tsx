import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { UUID_RE } from "@/lib/format";

// Destino del QR pegado en cada equipo. Por ahora lleva al panel de la instalación;
// sin sesión, getSession manda al login.
export default async function EquipmentQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const { supabase, membership } = await getSession();
  if (membership.role === "technician") redirect("/tecnico");
  const { data } = await supabase.from("assets").select("installation_id").eq("id", id).maybeSingle();
  if (!data?.installation_id) notFound();
  redirect(`/app/instalaciones/${data.installation_id}`);
}

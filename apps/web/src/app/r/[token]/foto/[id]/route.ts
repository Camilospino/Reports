import { downloadAttachment, loadReport } from "@/lib/report";

// Foto o firma del reporte público. El bucket es privado: se verifica el token con
// public_report() y solo se entrega un archivo que pertenezca a esa orden.
export async function GET(_: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  const report = await loadReport(token);
  const file = report?.attachments.find((a) => a.id === id);
  if (!file) return new Response("No encontrada", { status: 404 });

  const blob = await downloadAttachment(file.path);
  if (!blob) return new Response("No encontrada", { status: 404 });
  return new Response(blob, {
    headers: {
      "Content-Type": blob.type || "image/jpeg",
      // Los archivos de una orden cerrada no cambian.
      "Cache-Control": "private, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

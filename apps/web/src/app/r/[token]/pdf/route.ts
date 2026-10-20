import { loadReport } from "@/lib/report";
import { reportPdfResponse } from "@/lib/report-pdf";

// PDF público del reporte (botón "Descargar PDF"). Solo vía public_report().
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await loadReport(token);
  if (!report) return new Response("No encontrado", { status: 404 });
  return reportPdfResponse(report);
}

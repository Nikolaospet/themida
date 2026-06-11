import { renderToBuffer } from "@react-pdf/renderer";

import { ReportPDF } from "@/components/reports/ReportPDF";
import { loadScanExport } from "@/lib/scanner/scan-export";

interface Params {
  params: Promise<{ id: string }>;
}

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const data = await loadScanExport(id);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await renderToBuffer(
    <ReportPDF
      repoFullName={data.repoFullName}
      defaultBranch={data.defaultBranch}
      scan={data.scan}
      issues={data.issues}
    />,
  );

  const filename = `themida-${id}-report.pdf`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

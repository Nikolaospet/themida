import { toSarifString } from "@/lib/scanner/exporters/sarif";
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

  const sarif = toSarifString(data.findings);
  const filename = `themida-${id}-report.sarif`;

  return new Response(sarif, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

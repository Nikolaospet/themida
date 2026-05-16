import { renderToBuffer } from "@react-pdf/renderer";

import { ReportPDF } from "@/components/reports/ReportPDF";
import { getSample } from "@/lib/sample/data";

interface Params {
  params: Promise<{ slug: string }>;
}

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const sample = getSample(slug);

  if (!sample) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await renderToBuffer(
    <ReportPDF
      repoFullName={sample.repoFullName}
      blurb={sample.blurb}
      defaultBranch={sample.defaultBranch}
      commitSha={sample.commitSha}
      scan={sample.scan}
      issues={sample.issues}
    />,
  );

  const filename = `themida-${sample.slug}-report.pdf`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

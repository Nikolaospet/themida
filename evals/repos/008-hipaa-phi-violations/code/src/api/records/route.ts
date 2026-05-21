import { db } from "@/lib/db";

// GET /api/records/:id
// HIPAA-004 (§164.312(b)): the patient record access is "logged" only via the
// stdlib logger and no audit-trail entry (actor, record id, action,
// timestamp) is written to a tamper-resistant store, so PHI activity cannot
// be examined after the fact.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const patient = await db.patient.findUnique({ where: { id: params.id } });

  console.log("viewed patient record", params.id);

  return Response.json(patient);
}

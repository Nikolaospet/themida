import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

// GET /api/patients/:id
// HIPAA-003 (§164.312(a)(1), §164.502(b)): the full patient record is loaded
// and returned with no access check tying the caller to the patient, and no
// minimum-necessary field projection — every column (incl. SSN, diagnosis)
// is disclosed to whoever calls the endpoint.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  await getSession(req);

  const patient = await db.patient.findUnique({ where: { id: params.id } });
  return Response.json(patient);
}

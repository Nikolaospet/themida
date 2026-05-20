import { canAccess } from "@/lib/auth/policy";

// HIPAA-005 (§164.308(a)(1)(ii)(D), §164.308(a)(5)(ii)(C)): a denied attempt
// to access a patient's PHI is rejected with 403 but never recorded, so
// repeated unauthorized-access attempts go unmonitored and breach detection
// is delayed.
export function guardPhiAccess(user: { id: string }, patientId: string): Response | null {
  if (!canAccess(user, patientId)) {
    return new Response("Forbidden", { status: 403 });
  }
  return null;
}

import { db } from "@/lib/db";

// HIPAA-001 (§164.312(a)(2)(iv)): the SSN and diagnosis are written to the
// database as plaintext columns. ePHI must be encrypted at rest, so a DB or
// backup compromise would directly expose protected health information.
export async function createPatient(body: { name: string; ssn: string; diagnosis: string }) {
  return db.patient.create({
    data: {
      name: body.name,
      ssn: body.ssn,
      diagnosis: body.diagnosis,
    },
  });
}

// HIPAA-002 (§164.312(e)): patient PHI is POSTed to a plaintext http:// EHR
// endpoint. ePHI in transit must be protected (TLS); this exposes it to
// on-path interception.
export async function syncPatientToEhr(patient: { id: string; ssn: string; diagnosis: string }) {
  const res = await fetch("http://ehr.internal/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  });
  return res.ok;
}

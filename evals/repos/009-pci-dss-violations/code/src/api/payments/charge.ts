// PCI-002 (Req 4.2.1): cardholder data is POSTed to a plaintext http://
// payment gateway. PAN crossing open networks must use strong cryptography
// (TLS); this exposes it to on-path interception.
export async function chargeCard(pan: string, amount: number) {
  const res = await fetch("http://gateway.internal/charge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pan, amount }),
  });
  return res.ok;
}

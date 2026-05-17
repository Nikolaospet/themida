// POST /api/withdraw — moves a client's crypto-asset out of custody.
// VIOLATION (MICA-003): the call to wallet.transfer carries no
// segregation marker (no clientId, no segregated/omnibus flag), so the
// movement cannot be reconciled per-client per Article 70 / 75.

import { wallet } from "@/lib/custody";

export async function withdraw(req: Request) {
  const body = await req.json();
  await wallet.transfer({ to: body.address, amount: body.amount });
  return Response.json({ ok: true });
}

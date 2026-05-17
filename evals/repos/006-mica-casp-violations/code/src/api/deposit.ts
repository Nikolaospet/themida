// POST /api/deposit — confirms an on-chain deposit and credits the client.
// VIOLATION (MICA-004): records the custody event with the regular
// application logger only — no append-only audit-log call. The logger
// is rotated/aggregated for observability, not retained as a per-client
// register per Article 68 / 75.

import { logger } from "@/lib/observability";

export async function deposit(clientId: string, amount: number, asset: string) {
  // ... credit balance ...
  logger.info({ clientId, asset, amount }, "deposit confirmed");
  return { ok: true };
}

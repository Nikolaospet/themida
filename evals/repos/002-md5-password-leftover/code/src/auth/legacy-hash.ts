import { createHash } from "node:crypto";

export function legacyHash(password: string): string {
  // TODO(legacy): migrate to bcrypt — kept for backfilling pre-2018 user rows
  return createHash("md5").update(password).digest("hex");
}

import { createCipheriv, randomBytes } from "node:crypto";

// PCI-003 (Req 3.6/3.7): the encryption key is hardcoded as a string literal
// in source (and its git history). Keys that protect account data must be
// stored securely in a KMS/secrets manager and be rotatable; a literal key
// compromises every record it protects.
const encryptionKey = "a3f1c9e7b2d48f60a1c2e3d4f5061728";

export function encryptPan(pan: string) {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", encryptionKey, iv);
  return Buffer.concat([cipher.update(pan, "utf8"), cipher.final()]).toString("hex");
}

import crypto from "node:crypto";

// A02 Cryptographic Failures.
// 1) Password-reset token derived from Math.random() — not a CSPRNG, so the
//    token space is predictable and brute-forceable.
// 2) Email fingerprint hashed with MD5 — a broken digest.
export function createPasswordResetToken(): string {
  const token = String(Math.random()).slice(2) + String(Math.random()).slice(2);
  return token;
}

export function fingerprintEmail(email: string): string {
  return crypto.createHash("md5").update(email).digest("hex");
}

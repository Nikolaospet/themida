import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const WINDOW_MS = 5 * 60 * 1000;

type VerifyResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

function base64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function fromBase64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

function hmac(secret: string, data: string): Buffer {
  return createHmac("sha256", Buffer.from(secret, "hex")).update(data).digest();
}

/**
 * Signs an install state token binding the current `userId` and a
 * fresh nonce. `nowMs` exists for testing.
 */
export function signInstallState(userId: string, secret: string, nowMs = Date.now()): string {
  const nonce = randomBytes(12).toString("hex");
  const payload = `${userId}.${nonce}.${nowMs}`;
  const signature = hmac(secret, payload);
  return `${base64url(payload)}.${base64url(signature)}`;
}

/**
 * Verifies an install state token. Returns the bound user id on success.
 */
export function verifyInstallState(
  token: string,
  secret: string,
  nowMs = Date.now(),
): VerifyResult {
  if (!token || !token.includes(".")) {
    return { ok: false, reason: "malformed" };
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { ok: false, reason: "malformed" };
  }
  const [payloadEncoded, signatureEncoded] = parts;
  if (!payloadEncoded || !signatureEncoded) {
    return { ok: false, reason: "malformed" };
  }

  const payload = fromBase64url(payloadEncoded).toString("utf8");
  const expected = hmac(secret, payload);
  const actual = fromBase64url(signatureEncoded);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, reason: "bad_signature" };
  }

  const segments = payload.split(".");
  if (segments.length !== 3) {
    return { ok: false, reason: "malformed" };
  }
  const [userId, , timestampStr] = segments;
  if (!userId || !timestampStr) {
    return { ok: false, reason: "malformed" };
  }
  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp)) {
    return { ok: false, reason: "malformed" };
  }
  if (Math.abs(nowMs - timestamp) > WINDOW_MS) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, userId };
}

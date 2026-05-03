import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM authenticated encryption.
// Wire format: base64( iv (12 bytes) || authTag (16 bytes) || ciphertext )
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function normaliseKey(key: Buffer | string): Buffer {
  const buffer = typeof key === "string" ? Buffer.from(key, "hex") : key;
  if (buffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (got ${buffer.length})`);
  }
  return buffer;
}

export function encryptWithKey(plaintext: string, key: Buffer | string): string {
  if (plaintext.length === 0) {
    throw new Error("Cannot encrypt an empty string");
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, normaliseKey(key), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decryptWithKey(payload: string, key: Buffer | string): string {
  const buffer = Buffer.from(payload, "base64");
  if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Encrypted payload is too short to be valid");
  }
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, normaliseKey(key), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// Lazy import keeps the env-validating module out of unit tests.
async function getKey(): Promise<Buffer> {
  const { serverEnv } = await import("@/env");
  return normaliseKey(serverEnv.TOKEN_ENCRYPTION_KEY);
}

export async function encryptToken(plaintext: string): Promise<string> {
  return encryptWithKey(plaintext, await getKey());
}

export async function decryptToken(payload: string): Promise<string> {
  return decryptWithKey(payload, await getKey());
}

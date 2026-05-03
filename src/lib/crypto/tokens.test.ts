import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { decryptWithKey, encryptWithKey } from "./tokens";

const KEY = randomBytes(32);

describe("AES-256-GCM token encryption", () => {
  it("round-trips a typical GitHub token", () => {
    const token = "ghp_" + "a".repeat(36);
    const encrypted = encryptWithKey(token, KEY);
    expect(encrypted).not.toContain(token);
    expect(decryptWithKey(encrypted, KEY)).toBe(token);
  });

  it("round-trips unicode payloads", () => {
    const token = "θέμιδα-secret-🔐-token";
    expect(decryptWithKey(encryptWithKey(token, KEY), KEY)).toBe(token);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const token = "the same token";
    expect(encryptWithKey(token, KEY)).not.toBe(encryptWithKey(token, KEY));
  });

  it("fails to decrypt with the wrong key", () => {
    const otherKey = randomBytes(32);
    const encrypted = encryptWithKey("secret", KEY);
    expect(() => decryptWithKey(encrypted, otherKey)).toThrow();
  });

  it("fails to decrypt tampered ciphertext", () => {
    const encrypted = encryptWithKey("secret", KEY);
    const tampered = Buffer.from(encrypted, "base64");
    tampered.writeUInt8(tampered.readUInt8(tampered.length - 1) ^ 0xff, tampered.length - 1);
    expect(() => decryptWithKey(tampered.toString("base64"), KEY)).toThrow();
  });

  it("rejects empty plaintext", () => {
    expect(() => encryptWithKey("", KEY)).toThrow(/empty/);
  });

  it("rejects keys of the wrong length", () => {
    expect(() => encryptWithKey("x", randomBytes(16))).toThrow(/32 bytes/);
  });

  it("accepts hex-string keys", () => {
    const hexKey = randomBytes(32).toString("hex");
    const encrypted = encryptWithKey("hello", hexKey);
    expect(decryptWithKey(encrypted, hexKey)).toBe("hello");
  });

  it("rejects truncated payloads", () => {
    expect(() => decryptWithKey("YWJj", KEY)).toThrow(/too short/);
  });
});

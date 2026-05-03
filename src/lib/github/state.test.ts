// @vitest-environment node
import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { signInstallState, verifyInstallState } from "./state";

const SECRET = randomBytes(32).toString("hex");
const USER_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("install state", () => {
  it("round-trips a valid token", () => {
    const token = signInstallState(USER_ID, SECRET);
    const result = verifyInstallState(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.userId).toBe(USER_ID);
    }
  });

  it("rejects a token signed with a different secret", () => {
    const token = signInstallState(USER_ID, SECRET);
    const otherSecret = randomBytes(32).toString("hex");
    const result = verifyInstallState(token, otherSecret);
    expect(result.ok).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = signInstallState(USER_ID, SECRET);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    const result = verifyInstallState(tampered, SECRET);
    expect(result.ok).toBe(false);
  });

  it("rejects an expired token", () => {
    // 6 minutes in the past — older than the 5-minute window.
    const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
    const token = signInstallState(USER_ID, SECRET, sixMinutesAgo);
    const result = verifyInstallState(token, SECRET);
    expect(result.ok).toBe(false);
  });

  it("accepts a token within the window", () => {
    const fourMinutesAgo = Date.now() - 4 * 60 * 1000;
    const token = signInstallState(USER_ID, SECRET, fourMinutesAgo);
    const result = verifyInstallState(token, SECRET);
    expect(result.ok).toBe(true);
  });

  it("rejects malformed tokens", () => {
    expect(verifyInstallState("not-a-token", SECRET).ok).toBe(false);
    expect(verifyInstallState("", SECRET).ok).toBe(false);
  });
});

// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildInstallUrl } from "./install-url";

describe("buildInstallUrl", () => {
  it("uses the App's installations/new URL", () => {
    const url = buildInstallUrl({ slug: "themida-local", state: "abc" });
    expect(url).toContain("https://github.com/apps/themida-local/installations/new");
  });

  it("appends the state parameter URL-encoded", () => {
    const url = buildInstallUrl({ slug: "themida-local", state: "a b/c" });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("state")).toBe("a b/c");
  });

  it("URL-encodes the slug", () => {
    const url = buildInstallUrl({ slug: "themida local", state: "abc" });
    expect(url).toContain("themida%20local");
  });
});

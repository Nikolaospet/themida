// @vitest-environment node
import { describe, expect, it } from "vitest";

import { listFixtures, loadFixture, runAllFilterEvals } from "./runner";

describe("eval runner", () => {
  it("lists every committed fixture", async () => {
    const fixtures = await listFixtures();
    expect(fixtures).toContain("001-clean-react-todo");
    expect(fixtures).toContain("002-md5-password-leftover");
    expect(fixtures).toContain("003-missing-deletion-endpoint");
    expect(fixtures).toContain("004-ai-no-disclosure");
    expect(fixtures).toContain("005-mixed-violations");
  });

  it("loads + validates the manifest of every fixture", async () => {
    const fixtures = await listFixtures();
    for (const fixture of fixtures) {
      const { manifest, files } = await loadFixture(fixture);
      expect(manifest.name).toBe(fixture);
      expect(files.length).toBeGreaterThan(0);
    }
  });

  it("the filter surfaces every file path called out in expected_findings", async () => {
    const reports = await runAllFilterEvals();
    for (const report of reports) {
      expect(report.expectedMisses, `Misses for ${report.fixture}`).toEqual([]);
    }
  });

  it("the clean fixture has no expected findings", async () => {
    const { manifest } = await loadFixture("001-clean-react-todo");
    expect(manifest.expected_findings).toEqual([]);
  });

  it("each violation fixture references at least one rule id", async () => {
    const fixtures = await listFixtures();
    for (const fixture of fixtures) {
      if (fixture === "001-clean-react-todo") continue;
      const { manifest } = await loadFixture(fixture);
      expect(manifest.expected_findings.length).toBeGreaterThan(0);
    }
  });
});

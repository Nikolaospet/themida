// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ALL_RULES } from "@/lib/rules";

import { listFixtures, loadFixture, runAllFilterEvals } from "./runner";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type ExemptEntry = { rule_id: string; reason: string };
type ExemptFile = { exempt: ExemptEntry[] };

function loadExemptIds(): Map<string, string> {
  const raw = readFileSync(path.join(__dirname, "rules-exempt.json"), "utf8");
  const parsed = JSON.parse(raw) as ExemptFile;
  const map = new Map<string, string>();
  for (const entry of parsed.exempt) {
    if (!entry.reason || entry.reason.trim().length === 0) {
      throw new Error(`rules-exempt.json: ${entry.rule_id} has empty reason`);
    }
    map.set(entry.rule_id, entry.reason);
  }
  return map;
}

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
      // Baseline fixtures (`NNN-clean-*`) and framework-scaffold fixtures
      // (`*-scaffold`, created by `pnpm framework:new --with-fixture`) are
      // deliberately empty. Real violation fixtures must cite at least one
      // rule id.
      if (/^\d{3}-clean-/u.test(fixture) || fixture.endsWith("-scaffold")) continue;
      const { manifest } = await loadFixture(fixture);
      expect(manifest.expected_findings.length).toBeGreaterThan(0);
    }
  });

  it("every shipped rule is covered by a fixture or listed in rules-exempt.json", async () => {
    const fixtures = await listFixtures();
    const covered = new Set<string>();
    for (const fixture of fixtures) {
      const { manifest } = await loadFixture(fixture);
      for (const finding of manifest.expected_findings) {
        covered.add(finding.rule_id);
      }
    }
    const exempt = loadExemptIds();
    const uncovered = ALL_RULES.filter((rule) => !covered.has(rule.id) && !exempt.has(rule.id)).map(
      (rule) => rule.id,
    );
    expect(
      uncovered,
      `These rule ids have no eval fixture and no entry in evals/rules-exempt.json: ${uncovered.join(", ")}. Add a fixture under evals/repos/<NNN>-<slug>/ that asserts the rule fires, or add an exemption with a reason explaining why it cannot ship today.`,
    ).toEqual([]);
  });

  it("rules-exempt.json does not list ids that already have a fixture", async () => {
    const fixtures = await listFixtures();
    const covered = new Set<string>();
    for (const fixture of fixtures) {
      const { manifest } = await loadFixture(fixture);
      for (const finding of manifest.expected_findings) {
        covered.add(finding.rule_id);
      }
    }
    const exempt = loadExemptIds();
    const stale = [...exempt.keys()].filter((id) => covered.has(id));
    expect(
      stale,
      `Remove these from evals/rules-exempt.json (they now have fixtures): ${stale.join(", ")}`,
    ).toEqual([]);
  });

  it("rules-exempt.json only references real rule ids", async () => {
    const exempt = loadExemptIds();
    const known = new Set(ALL_RULES.map((rule) => rule.id));
    const unknown = [...exempt.keys()].filter((id) => !known.has(id));
    expect(unknown, `rules-exempt.json references unknown rule ids: ${unknown.join(", ")}`).toEqual(
      [],
    );
  });
});

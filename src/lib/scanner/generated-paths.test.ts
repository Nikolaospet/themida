import { describe, expect, it } from "vitest";

import type { RawFinding } from "./findings";
import { dropGeneratedPathFindings, isGeneratedPath } from "./generated-paths";

const finding = (file_path: string): RawFinding => ({
  rule_id: "GDPR-001",
  framework: "gdpr",
  file_path,
  line_number: 1,
  code_snippet: "md5(password)",
  title: "Broken hash",
  explanation: "uses md5",
  severity: "CRITICAL",
  legal_reference: "Article 5(1)(f)",
  legal_risk: "Up to €20M",
  fix_description: "use bcrypt",
  fix_code: "bcrypt.hash(p, 12)",
  fix_time_estimate: "~30 minutes",
  confidence: "HIGH",
});

describe("isGeneratedPath", () => {
  it.each([
    "node_modules/lodash/index.js",
    "packages/app/node_modules/x.js",
    "dist/bundle.js",
    "apps/web/dist/server.js",
    ".next/static/chunks/main.js",
    "build/output.js",
    "coverage/lcov-report/index.html",
    "out/index.html",
    ".turbo/cache/x.js",
    "src/vendor.min.js",
    "public/app.min.css",
  ])("flags generated path %s", (path) => {
    expect(isGeneratedPath(path)).toBe(true);
  });

  it.each([
    "src/auth.ts",
    "src/lib/scanner/verify.ts",
    "app/api/users/route.ts",
    "lib/distance.ts", // "dist" only as a substring, not a path segment
    "src/build-utils.ts", // "build" only as a substring
    "components/Button.tsx",
  ])("does not flag real source path %s", (path) => {
    expect(isGeneratedPath(path)).toBe(false);
  });
});

describe("dropGeneratedPathFindings", () => {
  it("partitions findings into kept and dropped by generated path", () => {
    const findings = [
      finding("src/auth.ts"),
      finding("dist/auth.js"),
      finding("app/api/route.ts"),
      finding("node_modules/pkg/index.js"),
    ];

    const { kept, dropped } = dropGeneratedPathFindings(findings);

    expect(kept.map((f) => f.file_path)).toEqual(["src/auth.ts", "app/api/route.ts"]);
    expect(dropped.map((f) => f.file_path)).toEqual(["dist/auth.js", "node_modules/pkg/index.js"]);
  });

  it("returns all findings as kept when none are generated", () => {
    const findings = [finding("src/a.ts"), finding("src/b.ts")];
    const { kept, dropped } = dropGeneratedPathFindings(findings);
    expect(kept).toHaveLength(2);
    expect(dropped).toHaveLength(0);
  });
});

// @vitest-environment node
/* eslint-disable security/detect-non-literal-fs-filename --
   The fixture walker operates on a known, committed directory; paths come
   from our own codebase, never from user input. */
import { promises as fs } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { runComplianceScan } from "@/lib/scanner";
import type { ScannerFile } from "@/lib/scanner/types";

const ENABLED = process.env.LIVE_LLM === "1";
const maybeDescribe = ENABLED ? describe : describe.skip;

async function loadFixture(): Promise<ScannerFile[]> {
  const root = path.resolve(process.cwd(), "evals/repos/002-md5-password-leftover/code");
  async function walk(dir: string): Promise<string[]> {
    const out: string[] = [];
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...(await walk(p)));
      } else if (entry.isFile()) {
        out.push(p);
      }
    }
    return out;
  }

  const files = await walk(root);
  const out: ScannerFile[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const rel = path.relative(root, file);
    out.push({ path: rel, size: Buffer.byteLength(content, "utf8"), content });
  }
  return out;
}

maybeDescribe("live OpenRouter against 002-md5-password-leftover", () => {
  it("finds at least one verified GDPR-001 finding", async () => {
    const files = await loadFixture();
    const result = await runComplianceScan({ files, frameworks: ["gdpr"] });
    const gdpr001 = result.findings.filter((f) => f.rule_id === "GDPR-001");
    expect(gdpr001.length).toBeGreaterThan(0);
  }, 120_000); // up to 2 minutes — :free latency budget
});

#!/usr/bin/env tsx
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

type Args = {
  id: string;
  displayName: string;
  prefix: string;
  regulationUrl: string;
  withFixture: boolean;
};

function parseArgs(argv: readonly string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  let withFixture = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--with-fixture") {
      withFixture = true;
      continue;
    }
    if (arg?.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[++i];
      if (value === undefined) usage(`flag --${key} requires a value`);
      flags[key] = value;
      continue;
    }
    if (arg !== undefined) positional.push(arg);
  }
  const id = positional[0];
  if (!id) usage("framework id is required (e.g. `pnpm framework:new mica`)");
  if (!/^[a-z][a-z0-9-]+$/u.test(id)) usage(`invalid id '${id}': use lowercase, digits, dashes`);

  const prefix = (flags.prefix ?? id.toUpperCase().replace(/-/gu, "")).toUpperCase();
  if (!/^[A-Z][A-Z0-9-]+$/u.test(prefix)) usage(`invalid prefix '${prefix}'`);

  return {
    id,
    displayName: flags.name ?? toDisplayName(id),
    prefix,
    regulationUrl: flags.regulation ?? "https://example.invalid/replace-me",
    withFixture,
  };
}

function toDisplayName(id: string): string {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function usage(message?: string): never {
  if (message) console.error(`error: ${message}\n`);
  console.error(`Usage: pnpm framework:new <id> [options]

  <id>               kebab-case framework id (e.g. mica, hipaa)

  --name "Label"     display name (default: title-cased id)
  --prefix PFX       rule-id prefix (default: id without dashes, uppercased)
  --regulation URL   regulation source URL (default: placeholder)
  --with-fixture     also create a noop eval fixture under evals/repos/`);
  process.exit(message ? 1 : 0);
}

function writeFileSafe(filePath: string, content: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  try {
    // `wx` is the atomic "create if absent" flag — no TOCTOU window
    // between check-then-write that a plain existsSync() would leave.
    writeFileSync(filePath, content, { flag: "wx" });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(`refusing to overwrite existing file: ${path.relative(ROOT, filePath)}`);
    }
    throw err;
  }
  console.log(`  created  ${path.relative(ROOT, filePath)}`);
}

function patchRegistry(args: Args): void {
  const registryPath = path.join(ROOT, "src/lib/rules/frameworks/registry.ts");
  const original = readFileSync(registryPath, "utf8");
  const constName = constNameFromId(args.id) + "_PACK";
  if (original.includes(`./${args.id}`)) {
    throw new Error(`registry already imports ./${args.id}; aborting`);
  }
  const importLine = `import { ${constName} } from "./${args.id}";`;
  const entryLine = `  "${args.id}": ${constName},`;

  const withImport = insertImport(original, importLine);
  const patched = insertRegistryEntry(withImport, entryLine);
  writeFileSync(registryPath, patched);
  console.log(`  patched  ${path.relative(ROOT, registryPath)}`);
}

function insertImport(source: string, importLine: string): string {
  // Insert before the type import (which always lives at the top of the
  // import block) to keep alphabetical-ish order without parsing.
  const marker = `import type { FrameworkPack } from "../types";`;
  if (!source.includes(marker)) {
    throw new Error(`registry.ts has unexpected shape; missing '${marker}'`);
  }
  return source.replace(marker, `${importLine}\n${marker}`);
}

function insertRegistryEntry(source: string, entryLine: string): string {
  const marker = "} as const satisfies Record<string, FrameworkPack>;";
  if (!source.includes(marker)) {
    throw new Error(`registry.ts has unexpected shape; missing '${marker}'`);
  }
  return source.replace(marker, `${entryLine}\n${marker}`);
}

function constNameFromId(id: string): string {
  return id.toUpperCase().replace(/-/gu, "_");
}

function makeMeta(args: Args): string {
  const meta = {
    id: args.id,
    displayName: args.displayName,
    version: "1.0.0",
    regulationUrl: args.regulationUrl,
    ruleIdPrefix: args.prefix,
  };
  return JSON.stringify(meta, null, 2) + "\n";
}

function makeSampleRule(args: Args): string {
  const ruleId = `${args.prefix}-001`;
  const constName = ruleId.replace(/-/gu, "_");
  return `import type { ComplianceRule } from "../../../types";

export const ${constName}: ComplianceRule = {
  id: "${ruleId}",
  framework: "${args.id}",
  version: "1.0.0",
  article: "Article TBD",
  legalText: "Replace with the literal regulation text this rule enforces.",
  legalSource: "${args.regulationUrl}",
  legalRisk: "Describe the fine or sanction exposure for non-compliance.",
  severity: "MEDIUM",
  title: "Replace with a short, specific title",
  description: "Describe the violation pattern this rule catches.",
  codePatterns: [],
  keywords: [],
  fileTypes: [".ts", ".tsx", ".js", ".jsx"],
  violationExamples: [],
  complianceExamples: [],
  findingTemplate: {
    explanation: "Explain why the matched code violates the article.",
    fixDescription: "Describe how the developer should fix it.",
    fixCodeTemplate: "// Replace with paste-ready compliant code.",
    estimatedFixTime: "~30 minutes",
    references: ["${args.regulationUrl}"],
  },
};
`;
}

function makeIndex(args: Args): string {
  const ruleId = `${args.prefix}-001`;
  const constName = ruleId.replace(/-/gu, "_");
  const packName = constNameFromId(args.id) + "_PACK";
  const rulesName = constNameFromId(args.id) + "_RULES";
  return `import type { FrameworkPack } from "../../types";
import meta from "./meta.json";
import { ${constName} } from "./rules/${ruleId}";

export const ${rulesName} = [${constName}] as const;

export const ${packName}: FrameworkPack = {
  meta,
  rules: ${rulesName},
};

export { ${constName} };
`;
}

function nextFixtureNumber(): string {
  const dir = path.join(ROOT, "evals/repos");
  if (!existsSync(dir)) return "001";
  const numbers = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => Number.parseInt(entry.name.slice(0, 3), 10))
    .filter((n) => Number.isInteger(n));
  const next = Math.max(0, ...numbers) + 1;
  return String(next).padStart(3, "0");
}

function writeNoopFixture(args: Args): void {
  const number = nextFixtureNumber();
  const slug = `${number}-${args.id}-scaffold`;
  const root = path.join(ROOT, "evals/repos", slug);
  const manifest = {
    name: slug,
    description: `Scaffold fixture for the ${args.displayName} pack; no expected findings.`,
    frameworks: [args.id],
    expected_findings: [],
  };
  writeFileSafe(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  writeFileSafe(
    path.join(root, "code/src/index.ts"),
    `// Placeholder code for the ${args.displayName} scaffold fixture.\n` +
      `export function placeholder(): void {}\n`,
  );
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const frameworkRoot = path.join(ROOT, "src/lib/rules/frameworks", args.id);
  if (existsSync(frameworkRoot)) {
    console.error(
      `error: framework directory already exists: ${path.relative(ROOT, frameworkRoot)}`,
    );
    process.exit(1);
  }

  console.log(`scaffolding framework '${args.id}' (prefix ${args.prefix})`);
  writeFileSafe(path.join(frameworkRoot, "meta.json"), makeMeta(args));
  writeFileSafe(path.join(frameworkRoot, "rules", `${args.prefix}-001.ts`), makeSampleRule(args));
  writeFileSafe(path.join(frameworkRoot, "index.ts"), makeIndex(args));
  patchRegistry(args);

  if (args.withFixture) {
    writeNoopFixture(args);
  }

  console.log(`\ndone. Next steps:
  1. Replace the placeholder rule body in src/lib/rules/frameworks/${args.id}/rules/${args.prefix}-001.ts
  2. Add at least four more rules (the project target is five rules per pack)
  3. Add an eval fixture under evals/repos/ with real expected_findings
  4. Add a row for '${args.displayName}' in docs/reference/frameworks.md
  5. Run: pnpm typecheck && pnpm test && pnpm evals:run`);
}

main();

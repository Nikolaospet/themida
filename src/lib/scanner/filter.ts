import type { FilteredFile, ScannerFile } from "./types";

const HIGH_PRIORITY_DIR_PATTERNS = [
  /\bauth\b/u,
  /\blogin\b/u,
  /\bregister\b/u,
  /\buser\b/u,
  /\bprofile\b/u,
  /\baccount\b/u,
  /\bpayment\b/u,
  /\bbilling\b/u,
  /\bcheckout\b/u,
  /\bapi\b/u,
  /\broutes?\b/u,
  /\bcontrollers?\b/u,
  /\bmiddleware\b/u,
  /\bdb\b/u,
  /\bdatabase\b/u,
  /\bmodels?\b/u,
  /\bschemas?\b/u,
  /\bmigrations?\b/u,
  /\bconfig\b/u,
  /\.env/u,
  /\bhealth\b/u,
  /\bpatient\b/u,
  /\bmedical\b/u,
  /\bhipaa\b/u,
];

const IGNORE_PATH_PATTERNS = [
  /(^|\/)node_modules\//u,
  /(^|\/)\.git\//u,
  /(^|\/)dist\//u,
  /(^|\/)build\//u,
  /(^|\/)\.next\//u,
  /(^|\/)coverage\//u,
  /(^|\/)public\//u,
  /(^|\/)__tests__\//u,
  /(^|\/)__mocks__\//u,
  /(^|\/)\.husky\//u,
  /\.test\.[a-z]+$/u,
  /\.spec\.[a-z]+$/u,
];

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".rb",
  ".php",
  ".go",
  ".rs",
  ".html",
  ".vue",
  ".svelte",
  ".sql",
  ".prisma",
]);

const RISK_KEYWORDS = [
  "email",
  "password",
  "phone",
  "ssn",
  "passport",
  "creditcard",
  "credit_card",
  "cardnumber",
  "cvv",
  "bank",
  "iban",
  "patient",
  "health",
  "consent",
  "gdpr",
  "ai_act",
  "ai-act",
  "aiact",
  "biometric",
  "emotion",
  "anthropic",
  "openai",
  "claude",
  "gpt",
  "rekognition",
  "fingerprint",
  "md5",
  "sha1",
  "bcrypt",
  "argon2",
  "jwt",
  "token",
  "apikey",
  "api_key",
  "localstorage",
  "session",
  "tracking",
  "analytics",
  "mixpanel",
  "segment",
  "amplitude",
];

function extension(path: string): string {
  const idx = path.lastIndexOf(".");
  return idx === -1 ? "" : path.slice(idx).toLowerCase();
}

function pathScore(path: string): number {
  let score = 0;
  for (const pattern of HIGH_PRIORITY_DIR_PATTERNS) {
    if (pattern.test(path)) score += 10;
  }
  if (path.includes("/test/") || path.includes("/tests/")) score -= 5;
  if (path.split("/").length <= 2) score += 1;
  return score;
}

function contentScore(content: string | undefined): number {
  if (!content) return 0;
  const lower = content.toLowerCase();
  let score = 0;
  for (const keyword of RISK_KEYWORDS) {
    if (lower.includes(keyword)) score += 2;
  }
  return score;
}

export type FilterOptions = {
  maxFiles?: number;
  /**
   * Diff mode: when set, only files whose path is in this set are considered
   * (the usual ignore/extension/score rules still apply within that set).
   * Used by `--diff`/`--github-pr` to scan only the files a PR touched.
   */
  diffPaths?: ReadonlySet<string>;
};

export function filterRepoFiles(
  files: readonly ScannerFile[],
  options: FilterOptions = {},
): FilteredFile[] {
  const maxFiles = options.maxFiles ?? Number.POSITIVE_INFINITY;
  const { diffPaths } = options;

  const scored: FilteredFile[] = [];
  for (const file of files) {
    if (diffPaths && !diffPaths.has(file.path)) continue;
    if (IGNORE_PATH_PATTERNS.some((p) => p.test(file.path))) continue;
    if (!ALLOWED_EXTENSIONS.has(extension(file.path))) continue;

    const score = pathScore(file.path) + contentScore(file.content);
    if (score <= 0 && file.size < 100) continue;
    scored.push({ ...file, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxFiles);
}

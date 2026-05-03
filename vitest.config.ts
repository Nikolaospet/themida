import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Load .env.local so integration tests against the local Supabase pick up
// NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
loadEnvLocal();

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  let inQuoted = false;
  let buffer = "";
  for (const rawLine of content.split("\n")) {
    if (inQuoted) {
      buffer += "\n" + rawLine;
      if (rawLine.endsWith('"')) {
        applyKv(buffer);
        buffer = "";
        inQuoted = false;
      }
      continue;
    }
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (/^[A-Z0-9_]+="/u.test(line) && !line.endsWith('"')) {
      buffer = rawLine;
      inQuoted = true;
      continue;
    }
    applyKv(line);
  }
}

function applyKv(line: string): void {
  const eq = line.indexOf("=");
  if (eq <= 0) return;
  const key = line.slice(0, eq).trim();
  if (!/^[A-Z0-9_]+$/u.test(key)) return;
  if (Reflect.get(process.env, key) !== undefined) return;
  let value = line.slice(eq + 1);
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
  Object.defineProperty(process.env, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  });
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./test-stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "evals/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        ".next/",
        "**/*.config.*",
        "**/*.d.ts",
        "vitest.setup.ts",
        "evals/repos/**",
      ],
    },
  },
});

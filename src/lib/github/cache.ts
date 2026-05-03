// Server-only by transitive dependency on createSupabaseAdminClient, which
// uses serverEnv. We omit the explicit `server-only` marker so this module
// stays importable from CLI scripts (`pnpm dev:fetch`).
import { gunzipSync, gzipSync } from "node:zlib";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { FileContent } from "./types";

/**
 * Returns a Map<blobSha, content> populated only for SHAs we already
 * have. Missing SHAs are absent from the map.
 */
export async function getCachedFiles(
  repoId: string,
  blobShas: readonly string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (blobShas.length === 0) return out;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("repo_file_cache")
    .select("blob_sha, content_compressed")
    .eq("repo_id", repoId)
    .in("blob_sha", [...blobShas]);

  if (error) throw new Error(`cache read failed: ${error.message}`);
  if (!data) return out;

  for (const row of data) {
    if (!row.content_compressed) continue;
    const buf = decodeBytea(row.content_compressed);
    const content = gunzipSync(buf).toString("utf8");
    out.set(row.blob_sha, content);
  }
  return out;
}

export async function setCachedFiles(repoId: string, files: readonly FileContent[]): Promise<void> {
  if (files.length === 0) return;

  const admin = createSupabaseAdminClient();
  const rows = files.map((f) => ({
    repo_id: repoId,
    blob_sha: f.sha,
    file_path: f.path,
    // PostgREST encodes bytea inserts as `\x<hex>`. Sending a Node Buffer
    // directly causes supabase-js to JSON-stringify it, which Postgres
    // then stores as the bytes of the JSON string — useless.
    content_compressed: "\\x" + gzipSync(Buffer.from(f.content, "utf8")).toString("hex"),
    content_size: Buffer.byteLength(f.content, "utf8"),
  }));

  const { error } = await admin
    .from("repo_file_cache")
    .upsert(rows, { onConflict: "repo_id,blob_sha" });

  if (error) throw new Error(`cache write failed: ${error.message}`);
}

function decodeBytea(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") {
    if (value.startsWith("\\x")) {
      return Buffer.from(value.slice(2), "hex");
    }
    return Buffer.from(value, "base64");
  }
  throw new Error("unsupported bytea representation in cache row");
}

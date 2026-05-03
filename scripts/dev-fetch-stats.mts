/* eslint-disable no-console */
// Self-contained dev script. Loads .env.local, picks the most recently
// connected repo, runs the fetcher with cache, prints stats.
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: ".env.local" });

import { gunzipSync, gzipSync } from "node:zlib";

import { createClient } from "@supabase/supabase-js";
import { App } from "octokit";

type ScannerFile = { path: string; size: number; content: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const appId = process.env.GITHUB_APP_ID ?? "";
const privateKey = (process.env.GITHUB_APP_PRIVATE_KEY ?? "").replace(/\\n/gu, "\n");

if (!supabaseUrl || !serviceRoleKey || !appId || !privateKey) {
  console.error(
    "Missing env. Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + GITHUB_APP_ID + GITHUB_APP_PRIVATE_KEY in .env.local",
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main(): Promise<void> {
  const { data: repo, error } = await admin
    .from("repos")
    .select("id, owner, name, full_name, installation_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!repo) {
    console.error("No connected repo found. Connect one via /repos/connect first.");
    process.exit(1);
  }
  if (!repo.installation_id) {
    console.error(`Repo ${repo.full_name} has no installation_id.`);
    process.exit(1);
  }

  console.log(`Fetching ${repo.full_name} (installation ${repo.installation_id})...\n`);

  const app = new App({ appId, privateKey });
  const octokit = await app.getInstallationOctokit(repo.installation_id);

  const coldStart = Date.now();
  const refRes = await octokit.rest.git.getRef({
    owner: repo.owner,
    repo: repo.name,
    ref: "heads/" + (await getDefaultBranch(octokit, repo.owner, repo.name)),
  });
  const commitSha = refRes.data.object.sha;
  const treeRes = await octokit.rest.git.getTree({
    owner: repo.owner,
    repo: repo.name,
    tree_sha: commitSha,
    recursive: "true",
  });

  const blobs = treeRes.data.tree
    .filter((t) => t.type === "blob" && t.path && t.sha && typeof t.size === "number")
    .map((t) => ({ path: t.path!, sha: t.sha!, size: t.size! }));

  // Cache lookup
  const { data: cachedRows } = await admin
    .from("repo_file_cache")
    .select("blob_sha, content_compressed")
    .eq("repo_id", repo.id)
    .in(
      "blob_sha",
      blobs.map((b) => b.sha),
    );

  const cached = new Map<string, string>();
  for (const row of cachedRows ?? []) {
    if (!row.content_compressed) continue;
    const buf = decodeBytea(row.content_compressed);
    cached.set(row.blob_sha, gunzipSync(buf).toString("utf8"));
  }

  const toFetch = blobs.filter((b) => !cached.has(b.sha));
  const fresh: ScannerFile[] = [];
  const concurrency = 30;
  for (let i = 0; i < toFetch.length; i += concurrency) {
    const chunk = toFetch.slice(i, i + concurrency);
    const settled = await Promise.all(
      chunk.map(async (entry) => {
        const { data } = await octokit.rest.git.getBlob({
          owner: repo.owner,
          repo: repo.name,
          file_sha: entry.sha,
        });
        if (data.encoding !== "base64") return null;
        return {
          path: entry.path,
          size: entry.size,
          content: Buffer.from(data.content, "base64").toString("utf8"),
          sha: entry.sha,
        };
      }),
    );
    for (const s of settled) {
      if (s) fresh.push(s);
    }
  }

  // Cache write
  if (fresh.length > 0) {
    const rows = fresh.map((f) => ({
      repo_id: repo.id,
      blob_sha: (f as ScannerFile & { sha: string }).sha,
      file_path: f.path,
      content_compressed: "\\x" + gzipSync(Buffer.from(f.content, "utf8")).toString("hex"),
      content_size: Buffer.byteLength(f.content, "utf8"),
    }));
    await admin.from("repo_file_cache").upsert(rows, { onConflict: "repo_id,blob_sha" });
  }

  const totalBytes = blobs.reduce((acc, b) => acc + b.size, 0);
  const allContents: ScannerFile[] = [
    ...fresh,
    ...blobs
      .filter((b) => cached.has(b.sha))
      .map((b) => ({ path: b.path, size: b.size, content: cached.get(b.sha)! })),
  ];
  const totalTokens = allContents.reduce((acc, f) => acc + Math.ceil(f.content.length / 4), 0);
  const coldDuration = Date.now() - coldStart;

  console.log("=== Cold fetch ===");
  console.log(`  Tree files:      ${blobs.length}`);
  console.log(`  Fetched:         ${fresh.length}`);
  console.log(`  Cached:          ${blobs.length - fresh.length}`);
  console.log(`  Total bytes:     ${totalBytes.toLocaleString()}`);
  console.log(`  Total tokens:    ~${totalTokens.toLocaleString()}`);
  console.log(`  Duration:        ${coldDuration} ms`);
  console.log("");

  // Warm pass — should hit cache for all
  const warmStart = Date.now();
  const { data: warmRows } = await admin
    .from("repo_file_cache")
    .select("blob_sha")
    .eq("repo_id", repo.id)
    .in(
      "blob_sha",
      blobs.map((b) => b.sha),
    );
  const warmDuration = Date.now() - warmStart;

  console.log("=== Warm cache lookup ===");
  console.log(`  Cached rows:     ${warmRows?.length ?? 0}/${blobs.length}`);
  console.log(`  Duration:        ${warmDuration} ms`);
}

async function getDefaultBranch(
  octokit: {
    rest: {
      repos: {
        get: (args: {
          owner: string;
          repo: string;
        }) => Promise<{ data: { default_branch: string } }>;
      };
    };
  },
  owner: string,
  repo: string,
): Promise<string> {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data.default_branch;
}

function decodeBytea(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string") {
    if (value.startsWith("\\x")) return Buffer.from(value.slice(2), "hex");
    return Buffer.from(value, "base64");
  }
  throw new Error("unsupported bytea representation");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

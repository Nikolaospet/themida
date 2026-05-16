// @vitest-environment node
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { getCachedFiles, setCachedFiles } from "./cache";

const ENABLED =
  process.env.SUPABASE_LIVE_TESTS === "1" && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const maybeDescribe = ENABLED ? describe : describe.skip;

const admin = ENABLED ? createSupabaseAdminClient() : null;

let userId: string;
let installationId: number;
let repoId: string;

async function ensureUser(): Promise<void> {
  if (!admin) return;
  installationId = Math.floor(Math.random() * 1_000_000_000) + 1;

  // Create the auth user (the on_auth_user_created trigger seeds the profile).
  const email = `cache-test-${randomUUID()}@test.local`;
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (authError || !authData.user) throw authError ?? new Error("auth user not returned");
  userId = authData.user.id;

  await admin
    .from("github_installations")
    .insert({
      user_id: userId,
      installation_id: installationId,
      account_id: 1,
      account_login: "test",
      account_type: "User",
    })
    .throwOnError();
  const { data, error } = await admin
    .from("repos")
    .insert({
      user_id: userId,
      installation_id: installationId,
      github_repo_id: Math.floor(Math.random() * 1_000_000_000),
      owner: "test",
      name: "repo",
      full_name: "test/repo",
    })
    .select("id")
    .single();
  if (error) throw error;
  repoId = data.id;
}

async function cleanup(): Promise<void> {
  if (!admin || !userId) return;
  // Cascading deletes via auth.users → profiles → repos → repo_file_cache.
  await admin.auth.admin.deleteUser(userId);
}

maybeDescribe("repo_file_cache", () => {
  beforeAll(async () => {
    await ensureUser();
  });

  afterAll(async () => {
    await cleanup();
  });

  it("round-trips a single file", async () => {
    const content = "hello world\n".repeat(50);
    await setCachedFiles(repoId, [
      {
        path: "src/a.ts",
        sha: "0000000000000000000000000000000000000001",
        size: content.length,
        content,
      },
    ]);

    const got = await getCachedFiles(repoId, ["0000000000000000000000000000000000000001"]);
    expect(got.size).toBe(1);
    expect(got.get("0000000000000000000000000000000000000001")).toBe(content);
  });

  it("returns an empty map for unknown shas", async () => {
    const got = await getCachedFiles(repoId, ["ffffffffffffffffffffffffffffffffffffffff"]);
    expect(got.size).toBe(0);
  });

  it("upserts on the (repo_id, blob_sha) conflict target", async () => {
    const sha = "0000000000000000000000000000000000000002";
    await setCachedFiles(repoId, [{ path: "src/a.ts", sha, size: 5, content: "first" }]);
    await setCachedFiles(repoId, [{ path: "src/a.ts", sha, size: 6, content: "second" }]);
    const got = await getCachedFiles(repoId, [sha]);
    expect(got.get(sha)).toBe("second");
  });

  it("returns an empty map when given no shas", async () => {
    const got = await getCachedFiles(repoId, []);
    expect(got.size).toBe(0);
  });
});

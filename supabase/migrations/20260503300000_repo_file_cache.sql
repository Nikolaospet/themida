-- =====================================================================
-- Themida — Repo file cache migration
-- SHA-keyed gzip cache for repo file contents. Re-scans look up by
-- (repo_id, blob_sha) and skip the GitHub fetch when cached.
-- Phase 1.6 of the MVP.
-- =====================================================================

create table public.repo_file_cache (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.repos (id) on delete cascade,

  -- 40-char git blob SHA — content-addressed.
  blob_sha text not null,
  file_path text not null,

  content_compressed bytea not null,
  content_size integer not null check (content_size >= 0),

  cached_at timestamptz not null default now(),

  unique (repo_id, blob_sha)
);

create index repo_file_cache_repo_idx on public.repo_file_cache (repo_id);
create index repo_file_cache_cached_at_idx on public.repo_file_cache (cached_at);

alter table public.repo_file_cache enable row level security;

-- Cache is service-role only — neither anon nor authenticated read or write.
-- The scanner (Trigger.dev jobs in Phase 4) writes via the admin client.
revoke all on public.repo_file_cache from anon, authenticated;

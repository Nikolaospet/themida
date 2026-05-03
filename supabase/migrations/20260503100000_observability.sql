-- =====================================================================
-- Themida — Observability migration
-- Adds the claude_api_calls table for per-call cost + token tracking.
-- Phase 1.5 (D-spec EQ2). See docs/superpowers/specs/...
-- =====================================================================

create table public.claude_api_calls (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references public.scans (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,

  model text not null,
  pass text not null check (pass in ('recon', 'deep_scan', 'verification')),

  input_tokens integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0),
  cached_tokens integer not null default 0 check (cached_tokens >= 0),
  cost_cents integer not null check (cost_cents >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  request_id text,

  created_at timestamptz not null default now()
);

create index claude_api_calls_scan_idx on public.claude_api_calls (scan_id);
create index claude_api_calls_user_created_idx
  on public.claude_api_calls (user_id, created_at desc);

alter table public.claude_api_calls enable row level security;

create policy "claude_api_calls: select own"
  on public.claude_api_calls for select
  using (auth.uid() = user_id);

-- Authenticated role gets read-only via RLS; writes are service-role only.
revoke all on public.claude_api_calls from anon, authenticated;
grant select on public.claude_api_calls to authenticated;

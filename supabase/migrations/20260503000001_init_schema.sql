-- =====================================================================
-- Themida — Initial schema migration
-- Tables: profiles, repos, scans, issues, credit_transactions
-- Row Level Security enabled on every table from line 1.
-- =====================================================================

-- Required extensions ---------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------
-- profiles — extends auth.users
-- ----------------------------------------------------------------------
create type public.user_plan as enum ('free', 'starter', 'builder', 'growth', 'agency');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,

  -- GitHub OAuth provider token, encrypted at rest (AES-256-GCM payload).
  -- Stored as base64 string with embedded IV + auth tag. Decryption happens
  -- in the application layer using TOKEN_ENCRYPTION_KEY.
  github_token_encrypted text,

  plan public.user_plan not null default 'free',
  credits integer not null default 5 check (credits >= 0),
  credits_reset_at timestamptz,

  stripe_customer_id text,
  stripe_subscription_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

-- ----------------------------------------------------------------------
-- repos — connected GitHub repositories
-- ----------------------------------------------------------------------
create table public.repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  github_repo_id bigint not null,
  owner text not null,
  name text not null,
  full_name text not null,
  private boolean not null default false,
  default_branch text not null default 'main',
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, github_repo_id)
);

create index repos_user_idx on public.repos (user_id);

-- ----------------------------------------------------------------------
-- scans — every compliance scan invocation
-- ----------------------------------------------------------------------
create type public.scan_status as enum ('pending', 'running', 'completed', 'failed');

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.repos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  frameworks text[] not null check (array_length(frameworks, 1) >= 1),
  status public.scan_status not null default 'pending',
  credits_used integer not null default 0 check (credits_used >= 0),

  -- Results
  compliance_score integer check (compliance_score between 0 and 100),
  total_issues integer not null default 0 check (total_issues >= 0),
  critical_count integer not null default 0 check (critical_count >= 0),
  high_count integer not null default 0 check (high_count >= 0),
  medium_count integer not null default 0 check (medium_count >= 0),
  low_count integer not null default 0 check (low_count >= 0),
  estimated_fix_time text,

  -- Metadata
  files_scanned integer not null default 0 check (files_scanned >= 0),
  files_total integer not null default 0 check (files_total >= 0),
  error_message text,

  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index scans_repo_idx on public.scans (repo_id);
create index scans_user_idx on public.scans (user_id);
create index scans_status_idx on public.scans (status);

-- ----------------------------------------------------------------------
-- issues — individual findings inside a scan
-- ----------------------------------------------------------------------
create type public.severity as enum ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
create type public.confidence as enum ('HIGH', 'MEDIUM', 'LOW');

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,

  rule_id text not null,
  framework text not null,

  file_path text not null,
  line_number integer check (line_number is null or line_number > 0),
  code_snippet text,

  title text not null,
  explanation text not null,
  severity public.severity not null,
  legal_reference text,
  legal_risk text,

  fix_description text,
  fix_code text,
  fix_time_estimate text,

  confidence public.confidence not null default 'HIGH',
  false_positive boolean not null default false,

  created_at timestamptz not null default now()
);

create index issues_scan_idx on public.issues (scan_id);
create index issues_user_idx on public.issues (user_id);
create index issues_severity_idx on public.issues (severity);

-- ----------------------------------------------------------------------
-- credit_transactions — append-only ledger
-- ----------------------------------------------------------------------
create type public.credit_tx_type as enum (
  'signup_bonus',
  'scan',
  'purchase',
  'monthly_reset',
  'refund'
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  type public.credit_tx_type not null,
  scan_id uuid references public.scans (id) on delete set null,
  stripe_payment_intent text,
  description text,
  created_at timestamptz not null default now()
);

create index credit_transactions_user_idx on public.credit_transactions (user_id);

-- ----------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------
-- Auto-create a profiles row when a new auth user is created.
-- Pulls full_name + avatar_url from the GitHub OAuth metadata when present.
-- Grants the 5 free credits and logs the signup bonus transaction.
-- ----------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.credit_transactions (user_id, amount, type, description)
  values (new.id, 5, 'signup_bonus', 'Welcome — 5 free scan credits');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ======================================================================
-- Row Level Security
-- ======================================================================
alter table public.profiles enable row level security;
alter table public.repos enable row level security;
alter table public.scans enable row level security;
alter table public.issues enable row level security;
alter table public.credit_transactions enable row level security;

-- profiles ---------------------------------------------------------------
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- profiles row inserted by the on_auth_user_created trigger; users never
-- insert directly. delete cascade handled by the FK on auth.users.

-- repos ------------------------------------------------------------------
create policy "repos: select own"
  on public.repos for select
  using (auth.uid() = user_id);

create policy "repos: insert own"
  on public.repos for insert
  with check (auth.uid() = user_id);

create policy "repos: update own"
  on public.repos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "repos: delete own"
  on public.repos for delete
  using (auth.uid() = user_id);

-- scans ------------------------------------------------------------------
create policy "scans: select own"
  on public.scans for select
  using (auth.uid() = user_id);

-- scans are inserted/updated server-side via the service role. No insert
-- policy means anon/authenticated cannot create scans directly.

-- issues -----------------------------------------------------------------
create policy "issues: select own"
  on public.issues for select
  using (auth.uid() = user_id);

create policy "issues: update own (false_positive flag)"
  on public.issues for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- issues are inserted server-side by scan jobs.

-- credit_transactions ----------------------------------------------------
create policy "credit_transactions: select own"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- ledger is append-only and write-restricted to the service role.

-- ======================================================================
-- Permission grants — keep authenticated role minimal
-- ======================================================================
revoke all on public.scans from anon, authenticated;
revoke all on public.issues from anon, authenticated;
revoke all on public.credit_transactions from anon, authenticated;

grant select on public.scans to authenticated;
grant select, update (false_positive) on public.issues to authenticated;
grant select on public.credit_transactions to authenticated;

-- repos: full per-user CRUD via RLS.
grant select, insert, update, delete on public.repos to authenticated;

-- profiles: select + update own.
grant select, update on public.profiles to authenticated;

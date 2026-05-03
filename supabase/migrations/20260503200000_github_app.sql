-- =====================================================================
-- Themida — GitHub App migration
-- Adds the github_installations table and links repos to installations.
-- Phase 2 of the MVP. See docs/superpowers/specs/...
-- =====================================================================

create table public.github_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,

  -- GitHub's installation_id is globally unique per App.
  installation_id bigint not null unique,
  account_id bigint not null,
  account_login text not null,
  account_type text not null check (account_type in ('User', 'Organization')),
  suspended_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index github_installations_user_idx on public.github_installations (user_id);

alter table public.github_installations enable row level security;

create policy "github_installations: select own"
  on public.github_installations for select
  using (auth.uid() = user_id);

-- Writes happen exclusively via the service-role client (setup callback,
-- future webhook handlers). Authenticated users can only read their own.
revoke all on public.github_installations from anon, authenticated;
grant select on public.github_installations to authenticated;

-- Link repos to the installation that grants access.
alter table public.repos add column installation_id bigint
  references public.github_installations (installation_id) on delete set null;

create index repos_installation_idx on public.repos (installation_id);

-- Trigger maintaining updated_at on github_installations.
create trigger github_installations_set_updated_at
before update on public.github_installations
for each row execute function public.touch_updated_at();

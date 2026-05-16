-- =====================================================================
-- Themida — Waitlist for not-yet-shipped tiers and frameworks
-- Anonymous public can INSERT; only service role can SELECT.
-- =====================================================================

create table public.waitlist (
  id uuid primary key default gen_random_uuid (),
  email text not null,
  plan text,                       -- 'starter' | 'builder' | 'growth' | 'agency' | null
  source text,                     -- e.g. 'pricing-page', 'landing-cta'
  user_agent text,
  created_at timestamptz not null default now (),

  constraint waitlist_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create index waitlist_email_idx on public.waitlist (email);
create index waitlist_created_at_idx on public.waitlist (created_at desc);

-- Idempotent capture: same email + same plan = one row.
create unique index waitlist_email_plan_uidx
  on public.waitlist (email, coalesce(plan, ''));

alter table public.waitlist enable row level security;

-- Anyone (including anon) may add themselves to the waitlist.
create policy "waitlist: public can insert"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- Only service role can read (admin dashboard / export).
-- (No select policy = default deny for anon/authenticated.)

comment on table public.waitlist is
  'Email capture for paid tiers and unshipped frameworks. Public insert, service-role read.';

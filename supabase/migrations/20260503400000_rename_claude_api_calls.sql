-- =====================================================================
-- Phase 3b — rename claude_api_calls -> llm_api_calls and add provider.
-- The table now records calls to any LLM provider (OpenRouter, Anthropic,
-- ...). Existing rows backfill as 'anthropic'.
-- =====================================================================

alter table public.claude_api_calls rename to llm_api_calls;

alter table public.llm_api_calls
  add column provider text;

update public.llm_api_calls set provider = 'anthropic' where provider is null;

alter table public.llm_api_calls
  alter column provider set not null;

alter table public.llm_api_calls
  add constraint llm_api_calls_provider_chk
  check (provider in ('openrouter', 'anthropic'));

alter index claude_api_calls_pkey rename to llm_api_calls_pkey;
alter index claude_api_calls_scan_idx rename to llm_api_calls_scan_idx;
alter index claude_api_calls_user_created_idx rename to llm_api_calls_user_created_idx;

alter table public.llm_api_calls
  rename constraint claude_api_calls_scan_id_fkey to llm_api_calls_scan_id_fkey;

alter table public.llm_api_calls
  rename constraint claude_api_calls_user_id_fkey to llm_api_calls_user_id_fkey;

drop policy "claude_api_calls: select own" on public.llm_api_calls;
create policy "llm_api_calls: select own"
  on public.llm_api_calls for select
  using (auth.uid() = user_id);

revoke all on public.llm_api_calls from anon, authenticated;
grant select on public.llm_api_calls to authenticated;

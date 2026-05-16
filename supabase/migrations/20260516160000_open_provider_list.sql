-- =====================================================================
-- Themida — Provider open list
-- Removes the CHECK constraint that restricted `provider` to a closed
-- set ('openrouter', 'anthropic'). Self-hosters can now plug in any
-- backend (openai, groq, together, ollama, vllm, custom …) and the
-- cost-tracker will record whatever string the provider implementation
-- reports.
-- =====================================================================

alter table public.llm_api_calls
  drop constraint if exists llm_api_calls_provider_chk;

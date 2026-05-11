-- Phase 4-A: scan runtime state for Trigger.dev orchestration

-- 1. Progress payload written by the scan job at each phase boundary.
ALTER TABLE scans
  ADD COLUMN progress JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN scans.progress IS
  'Shape: { phase: "queued"|"fetching"|"filtering"|"recon"|"deep_scan"|"verifying"|"done", files_done: integer, files_total: integer }';

-- 2. Per-user 24h rolling cap state.
CREATE TABLE scan_rate_state (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  scans_in_window INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scan_rate_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own rate state"
  ON scan_rate_state FOR SELECT USING (auth.uid() = user_id);

revoke all on public.scan_rate_state from anon, authenticated;
grant select on public.scan_rate_state to authenticated;

-- Writes are server-only via the service-role client; no INSERT/UPDATE policy needed.

-- 3. Enable realtime publication for the scans table so the client can
--    subscribe to progress + status changes.
ALTER PUBLICATION supabase_realtime ADD TABLE scans;

-- 4. Helper: sum LLM spend in the rolling 24h window (server-side aggregate).
CREATE OR REPLACE FUNCTION sum_llm_cost_last_24h()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT COALESCE(SUM(cost_cents), 0)::BIGINT
  FROM llm_api_calls
  WHERE created_at > NOW() - INTERVAL '24 hours';
$$;

REVOKE EXECUTE ON FUNCTION sum_llm_cost_last_24h() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sum_llm_cost_last_24h() TO service_role;

-- 5. Helper: atomically consume a daily-scan slot, returning the new count
--    and whether the consumption was allowed. Resets the window if older
--    than 24h.
CREATE OR REPLACE FUNCTION consume_daily_scan_slot(p_user_id UUID, p_cap INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_state scan_rate_state%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  INSERT INTO scan_rate_state (user_id, scans_in_window, window_start)
    VALUES (p_user_id, 0, v_now)
    ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_state FROM scan_rate_state WHERE user_id = p_user_id FOR UPDATE;

  IF v_state.window_start < v_now - INTERVAL '24 hours' THEN
    v_state.scans_in_window := 0;
    v_state.window_start := v_now;
  END IF;

  IF v_state.scans_in_window >= p_cap THEN
    RETURN jsonb_build_object('allowed', false, 'scans_in_window', v_state.scans_in_window);
  END IF;

  v_state.scans_in_window := v_state.scans_in_window + 1;

  UPDATE scan_rate_state
    SET scans_in_window = v_state.scans_in_window,
        window_start = v_state.window_start
    WHERE user_id = p_user_id;

  RETURN jsonb_build_object('allowed', true, 'scans_in_window', v_state.scans_in_window);
END;
$$;

REVOKE EXECUTE ON FUNCTION consume_daily_scan_slot(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_daily_scan_slot(UUID, INTEGER) TO service_role;

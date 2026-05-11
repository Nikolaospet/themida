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

-- ============================================================
-- SKULKING — Supabase Schema
-- Run this in the SQL Editor of your Supabase project.
-- ============================================================

-- 1. TABLES
-- ============================================================

-- Game state (always exactly 1 row)
CREATE TABLE game (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phase text NOT NULL DEFAULT 'lobby',
  round_number integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO game (id, phase, round_number) VALUES (1, 'lobby', 0);

-- Players
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_admin boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now()
);

-- Bids (one per player per round)
CREATE TABLE bids (
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  bid integer NOT NULL,
  PRIMARY KEY (player_id, round_number)
);

-- Results (tricks won + bonuses, one per player per round)
CREATE TABLE results (
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  tricks_won integer NOT NULL,
  bonuses_json jsonb NOT NULL DEFAULT '{}',
  PRIMARY KEY (player_id, round_number)
);

-- Scores (calculated from bids + results)
CREATE TABLE scores (
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  round_points integer NOT NULL,
  total_points integer NOT NULL,
  has_bonus boolean NOT NULL DEFAULT false,
  PRIMARY KEY (player_id, round_number)
);

-- 2. DISABLE RLS (private family app)
-- ============================================================
ALTER TABLE game DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;

-- 3. ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE game;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE results;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;

-- 4. RPC FUNCTIONS
-- ============================================================

-- Join the game (validates lobby phase + player limit)
CREATE OR REPLACE FUNCTION join_game(p_name text, p_is_admin boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_player_id uuid;
  v_phase text;
BEGIN
  SELECT phase INTO v_phase FROM game WHERE id = 1;
  IF v_phase != 'lobby' THEN
    RAISE EXCEPTION 'Cannot join — game already in progress';
  END IF;
  IF (SELECT count(*) FROM players) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 players reached';
  END IF;
  INSERT INTO players (name, is_admin)
    VALUES (p_name, p_is_admin)
    RETURNING id INTO v_player_id;
  RETURN v_player_id;
END;
$$;

-- Submit a bid (auto-advances when all bids are in)
CREATE OR REPLACE FUNCTION submit_bid(p_player_id uuid, p_round integer, p_bid integer)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_player_count integer;
  v_bid_count integer;
BEGIN
  INSERT INTO bids (player_id, round_number, bid)
    VALUES (p_player_id, p_round, p_bid)
    ON CONFLICT (player_id, round_number) DO NOTHING;
  SELECT count(*) INTO v_player_count FROM players;
  SELECT count(*) INTO v_bid_count FROM bids WHERE round_number = p_round;
  IF v_bid_count >= v_player_count THEN
    UPDATE game SET phase = 'reveal_bids' WHERE id = 1;
  END IF;
END;
$$;

-- Submit result + auto-calculate scores when all results are in
CREATE OR REPLACE FUNCTION submit_result(
  p_player_id uuid,
  p_round integer,
  p_tricks integer,
  p_bonuses jsonb
)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_player_count integer;
  v_result_count integer;
  v_bonus_total integer;
  v_round_points integer;
  v_prev_total integer;
  v_bonus_earned boolean;
  rec RECORD;
BEGIN
  INSERT INTO results (player_id, round_number, tricks_won, bonuses_json)
    VALUES (p_player_id, p_round, p_tricks, p_bonuses)
    ON CONFLICT (player_id, round_number) DO NOTHING;

  SELECT count(*) INTO v_player_count FROM players;
  SELECT count(*) INTO v_result_count FROM results WHERE round_number = p_round;

  IF v_result_count >= v_player_count THEN
    -- Calculate scores for every player this round
    FOR rec IN
      SELECT r.player_id, r.tricks_won, r.bonuses_json, b.bid
      FROM results r
      JOIN bids b ON b.player_id = r.player_id AND b.round_number = r.round_number
      WHERE r.round_number = p_round
    LOOP
      v_bonus_total := 0;
      v_bonus_earned := false;

      -- Bonuses only count if bid > 0 and bid was made
      IF rec.bid > 0 AND rec.tricks_won = rec.bid THEN
        v_bonus_total :=
          (CASE WHEN (rec.bonuses_json->>'black14')::boolean IS TRUE THEN 20 ELSE 0 END) +
          (COALESCE((rec.bonuses_json->>'color14s')::integer, 0) * 10) +
          (CASE WHEN (rec.bonuses_json->>'mermaidDefeatsSkullKing')::boolean IS TRUE THEN 40 ELSE 0 END) +
          (COALESCE((rec.bonuses_json->>'skullKingDefeatsPirates')::integer, 0) * 30) +
          (COALESCE((rec.bonuses_json->>'piratesDefeatMermaids')::integer, 0) * 20);
        v_bonus_earned := v_bonus_total > 0;
      END IF;

      -- Scoring logic
      IF rec.bid = 0 THEN
        IF rec.tricks_won = 0 THEN
          v_round_points := 10 * p_round;
        ELSE
          v_round_points := -10 * p_round;
        END IF;
      ELSE
        IF rec.tricks_won = rec.bid THEN
          v_round_points := 20 * rec.bid + v_bonus_total;
        ELSE
          v_round_points := -10 * ABS(rec.bid - rec.tricks_won);
        END IF;
      END IF;

      -- Previous total
      SELECT COALESCE(s.total_points, 0) INTO v_prev_total
        FROM scores s
        WHERE s.player_id = rec.player_id AND s.round_number = p_round - 1;
      IF NOT FOUND THEN
        v_prev_total := 0;
      END IF;

      INSERT INTO scores (player_id, round_number, round_points, total_points, has_bonus)
        VALUES (rec.player_id, p_round, v_round_points, v_prev_total + v_round_points, v_bonus_earned)
        ON CONFLICT (player_id, round_number) DO NOTHING;
    END LOOP;

    UPDATE game SET phase = 'leaderboard' WHERE id = 1;
  END IF;
END;
$$;

-- Admin: start the game
CREATE OR REPLACE FUNCTION start_game()
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE game SET phase = 'bidding', round_number = 1, created_at = now() WHERE id = 1;
END;
$$;

-- Admin: advance from reveal_bids to scoring
CREATE OR REPLACE FUNCTION advance_to_scoring()
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE game SET phase = 'scoring' WHERE id = 1;
END;
$$;

-- Admin: next round (or finish)
CREATE OR REPLACE FUNCTION next_round()
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_round integer;
BEGIN
  SELECT round_number INTO v_round FROM game WHERE id = 1;
  IF v_round >= 10 THEN
    UPDATE game SET phase = 'finished' WHERE id = 1;
  ELSE
    UPDATE game SET phase = 'bidding', round_number = v_round + 1 WHERE id = 1;
  END IF;
END;
$$;

-- Reset everything
CREATE OR REPLACE FUNCTION reset_game()
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM scores;
  DELETE FROM results;
  DELETE FROM bids;
  DELETE FROM players;
  UPDATE game SET phase = 'lobby', round_number = 0, created_at = now() WHERE id = 1;
END;
$$;

-- Auto-cleanup if game is older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_stale_game()
RETURNS boolean
LANGUAGE plpgsql AS $$
DECLARE
  v_stale boolean;
BEGIN
  SELECT (created_at < now() - interval '24 hours') INTO v_stale
    FROM game WHERE id = 1;
  IF v_stale IS TRUE THEN
    PERFORM reset_game();
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

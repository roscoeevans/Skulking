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
  loot_bonus integer NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, round_number)
);

-- Loot alliance claims (initiator/acceptor model)
CREATE TABLE loot_claims (
  id serial PRIMARY KEY,
  initiator_id uuid REFERENCES players(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES players(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted'))
);

-- 2. DISABLE RLS (private family app)
-- ============================================================
ALTER TABLE game DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE loot_claims DISABLE ROW LEVEL SECURITY;

-- 3. ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE game;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE bids;
ALTER PUBLICATION supabase_realtime ADD TABLE results;
ALTER PUBLICATION supabase_realtime ADD TABLE scores;

-- 4. RPC FUNCTIONS
-- ============================================================

-- Join the game (validates lobby phase + player limit + single admin)
CREATE OR REPLACE FUNCTION join_game(p_name text, p_is_admin boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE
  v_player_id uuid;
  v_phase text;
  v_admin_exists boolean;
BEGIN
  SELECT phase INTO v_phase FROM game WHERE id = 1;
  IF v_phase != 'lobby' THEN
    RAISE EXCEPTION 'Cannot join — game already in progress';
  END IF;
  IF (SELECT count(*) FROM players) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 players reached';
  END IF;
  -- Enforce single admin
  IF p_is_admin THEN
    SELECT EXISTS(SELECT 1 FROM players WHERE is_admin = true) INTO v_admin_exists;
    IF v_admin_exists THEN
      RAISE EXCEPTION 'An admin player already exists';
    END IF;
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
  p_bonuses jsonb,
  p_loot_partners uuid[] DEFAULT '{}'
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
  v_loot_bonus integer;
  v_partner_hit boolean;
  rec RECORD;
  loot_rec RECORD;
  i integer;
BEGIN
  INSERT INTO results (player_id, round_number, tricks_won, bonuses_json)
    VALUES (p_player_id, p_round, p_tricks, p_bonuses)
    ON CONFLICT (player_id, round_number) DO NOTHING;

  -- Insert loot claims as INITIATOR (max 2)
  FOR i IN 1..LEAST(COALESCE(array_length(p_loot_partners, 1), 0), 2) LOOP
    IF p_loot_partners[i] IS NOT NULL THEN
      INSERT INTO loot_claims (initiator_id, partner_id, round_number, status)
        VALUES (p_player_id, p_loot_partners[i], p_round, 'pending');
    END IF;
  END LOOP;

  SELECT count(*) INTO v_player_count FROM players;
  SELECT count(*) INTO v_result_count FROM results WHERE round_number = p_round;

  IF v_result_count >= v_player_count THEN
    FOR rec IN
      SELECT r.player_id, r.tricks_won, r.bonuses_json, b.bid
      FROM results r
      JOIN bids b ON b.player_id = r.player_id AND b.round_number = r.round_number
      WHERE r.round_number = p_round
    LOOP
      v_bonus_total := 0;
      v_bonus_earned := false;
      v_loot_bonus := 0;

      -- Traditional bonuses only count if bid > 0 and bid was made
      IF rec.bid > 0 AND rec.tricks_won = rec.bid THEN
        v_bonus_total :=
          (CASE WHEN (rec.bonuses_json->>'black14')::boolean IS TRUE THEN 20 ELSE 0 END) +
          (COALESCE((rec.bonuses_json->>'color14s')::integer, 0) * 10) +
          (CASE WHEN (rec.bonuses_json->>'mermaidDefeatsSkullKing')::boolean IS TRUE THEN 40 ELSE 0 END) +
          (COALESCE((rec.bonuses_json->>'skullKingDefeatsPirates')::integer, 0) * 30) +
          (COALESCE((rec.bonuses_json->>'piratesDefeatMermaids')::integer, 0) * 20);
        v_bonus_earned := v_bonus_total > 0;
      END IF;

      -- Loot bonus: this player is INITIATOR in accepted alliances
      IF rec.tricks_won = rec.bid THEN
        FOR loot_rec IN
          SELECT lc.id, lc.partner_id
          FROM loot_claims lc
          WHERE lc.initiator_id = rec.player_id
            AND lc.round_number = p_round
            AND lc.status = 'accepted'
        LOOP
          SELECT r2.tricks_won = b2.bid INTO v_partner_hit
          FROM results r2
          JOIN bids b2 ON b2.player_id = r2.player_id AND b2.round_number = r2.round_number
          WHERE r2.player_id = loot_rec.partner_id AND r2.round_number = p_round;

          IF v_partner_hit IS TRUE THEN
            v_loot_bonus := v_loot_bonus + 20;
          END IF;
        END LOOP;

        -- Also: this player is PARTNER in accepted alliances
        FOR loot_rec IN
          SELECT lc.id, lc.initiator_id
          FROM loot_claims lc
          WHERE lc.partner_id = rec.player_id
            AND lc.round_number = p_round
            AND lc.status = 'accepted'
        LOOP
          SELECT r2.tricks_won = b2.bid INTO v_partner_hit
          FROM results r2
          JOIN bids b2 ON b2.player_id = r2.player_id AND b2.round_number = r2.round_number
          WHERE r2.player_id = loot_rec.initiator_id AND r2.round_number = p_round;

          IF v_partner_hit IS TRUE THEN
            v_loot_bonus := v_loot_bonus + 20;
          END IF;
        END LOOP;
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

      v_round_points := v_round_points + v_loot_bonus;
      IF v_loot_bonus > 0 THEN v_bonus_earned := true; END IF;

      SELECT COALESCE(s.total_points, 0) INTO v_prev_total
        FROM scores s
        WHERE s.player_id = rec.player_id AND s.round_number = p_round - 1;
      IF NOT FOUND THEN v_prev_total := 0; END IF;

      INSERT INTO scores (player_id, round_number, round_points, total_points, has_bonus, loot_bonus)
        VALUES (rec.player_id, p_round, v_round_points, v_prev_total + v_round_points, v_bonus_earned, v_loot_bonus)
        ON CONFLICT (player_id, round_number) DO NOTHING;
    END LOOP;

    UPDATE game SET phase = 'leaderboard' WHERE id = 1;
  END IF;
END;
$$;

-- Accept a pending loot alliance (called by partner)
CREATE OR REPLACE FUNCTION accept_loot_alliance(p_alliance_id integer)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE loot_claims SET status = 'accepted'
    WHERE id = p_alliance_id AND status = 'pending';
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
  DELETE FROM loot_claims;
  DELETE FROM bids;
  DELETE FROM players;
  UPDATE game SET phase = 'lobby', round_number = 0, created_at = now() WHERE id = 1;
END;
$$;

-- Restart with same players
CREATE OR REPLACE FUNCTION restart_same_players()
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM scores;
  DELETE FROM results;
  DELETE FROM loot_claims;
  DELETE FROM bids;
  UPDATE game SET phase = 'config', round_number = 0, total_rounds = 10 WHERE id = 1;
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

-- Admin: remove a player from the lobby
CREATE OR REPLACE FUNCTION remove_player(p_player_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_phase text;
BEGIN
  SELECT phase INTO v_phase FROM game WHERE id = 1;
  IF v_phase <> 'lobby' THEN
    RAISE EXCEPTION 'Players can only be removed during the lobby phase';
  END IF;
  DELETE FROM players WHERE id = p_player_id;
END;
$$;

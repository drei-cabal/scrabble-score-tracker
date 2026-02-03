-- ==========================================
-- AUTOMATIC DATA CLEANUP & CASCADING DELETES
-- ==========================================

-- 1. Enforce Cascading Deletes
-- This ensures that when a room is deleted, all its players and moves are also deleted.
-- We drop existing constraints and recreate them with ON DELETE CASCADE.

-- A) Update 'players' table: Drop and re-add foreign key to rooms
ALTER TABLE players
DROP CONSTRAINT IF EXISTS players_room_code_fkey,
ADD CONSTRAINT players_room_code_fkey
    FOREIGN KEY (room_code)
    REFERENCES rooms(room_code)
    ON DELETE CASCADE;

-- B) Update 'moves' table: Drop and re-add foreign key to rooms
ALTER TABLE moves
DROP CONSTRAINT IF EXISTS moves_room_code_fkey,
ADD CONSTRAINT moves_room_code_fkey
    FOREIGN KEY (room_code)
    REFERENCES rooms(room_code)
    ON DELETE CASCADE;

-- C) Update 'moves' table: Drop and re-add foreign key to players
-- This ensures if a player is deleted (e.g., via room deletion), their moves go too.
ALTER TABLE moves
DROP CONSTRAINT IF EXISTS moves_player_id_fkey,
ADD CONSTRAINT moves_player_id_fkey
    FOREIGN KEY (player_id)
    REFERENCES players(id)
    ON DELETE CASCADE;


-- 2. Create Cleanup Function
-- This function deletes rooms created more than 48 hours ago.
CREATE OR REPLACE FUNCTION delete_old_rooms()
RETURNS void AS $$
BEGIN
    DELETE FROM rooms
    WHERE created_at < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql;


-- 3. Schedule Automatic Cleanup (Using pg_cron)
-- Note: 'pg_cron' extension must be enabled in your Supabase project (Database -> Extensions).
-- If you cannot enable it, you can run this SQL command manually periodically or use an Edge Function.

-- Enable the extension (if allowed)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run every hour
-- Syntax: cron.schedule(job_name, schedule, command)
SELECT cron.schedule(
    'cleanup-old-rooms',   -- unique job name
    '0 * * * *',          -- every hour (at minute 0)
    $$SELECT delete_old_rooms()$$
);

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule/stop:
-- SELECT cron.unschedule('cleanup-old-rooms');

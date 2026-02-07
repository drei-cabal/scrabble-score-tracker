-- Scrabble Score Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_turn_index INTEGER DEFAULT 0,
  game_mode VARCHAR(20) DEFAULT 'multi-device' CHECK (game_mode IN ('multi-device', 'single-device')),
  turn_timer_enabled BOOLEAN DEFAULT false,
  turn_timer_seconds INTEGER DEFAULT 60 CHECK (turn_timer_seconds >= 10 AND turn_timer_seconds <= 300),
  turn_started_at TIMESTAMPTZ,
  is_paused BOOLEAN DEFAULT false,
  tile_bag JSONB DEFAULT '{
    "A": 9, "B": 2, "C": 2, "D": 4, "E": 12, "F": 2, "G": 3, "H": 2, "I": 9, "J": 1, "K": 1, "L": 4, "M": 2, "N": 6, "O": 8, "P": 2, "Q": 1, "R": 6, "S": 4, "T": 6, "U": 4, "V": 2, "W": 2, "X": 1, "Y": 2, "Z": 1, "BLANK": 2
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) REFERENCES rooms(room_code) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  total_score INTEGER DEFAULT 0,
  seat_order INTEGER,
  role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'spectator')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_code, name)
);

-- Create moves table
CREATE TABLE IF NOT EXISTS moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(10) REFERENCES rooms(room_code) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  word_played VARCHAR(50),
  points_scored INTEGER DEFAULT 0,
  move_type VARCHAR(20) CHECK (move_type IN ('word', 'skip', 'swap', 'end_game')),
  move_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_room_code ON players(room_code);
CREATE INDEX IF NOT EXISTS idx_players_seat_order ON players(room_code, seat_order);
CREATE INDEX IF NOT EXISTS idx_moves_room_code ON moves(room_code);
CREATE INDEX IF NOT EXISTS idx_moves_created_at ON moves(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_game_mode ON rooms(game_mode);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read on rooms" ON rooms;
DROP POLICY IF EXISTS "Allow public read on players" ON players;
DROP POLICY IF EXISTS "Allow public read on moves" ON moves;
DROP POLICY IF EXISTS "Allow public insert on rooms" ON rooms;
DROP POLICY IF EXISTS "Allow public insert on players" ON players;
DROP POLICY IF EXISTS "Allow public insert on moves" ON moves;
DROP POLICY IF EXISTS "Allow public update on rooms" ON rooms;
DROP POLICY IF EXISTS "Allow public update on players" ON players;
DROP POLICY IF EXISTS "Allow public delete on moves" ON moves;

-- Create RLS policies for public access (no auth required)
CREATE POLICY "Allow public read on rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow public read on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read on moves" ON moves FOR SELECT USING (true);

CREATE POLICY "Allow public insert on rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on moves" ON moves FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on rooms" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Allow public update on players" ON players FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on moves" ON moves FOR DELETE USING (true);

-- Enable Realtime
-- Note: You must also enable Realtime for these tables in the Supabase Dashboard
-- Go to Database > Replication and enable for: rooms, players, moves

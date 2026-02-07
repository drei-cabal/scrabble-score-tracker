-- Migration: Add Game Mode and Turn Timer Features
-- Run this SQL in your Supabase SQL Editor to add new columns to existing rooms table

-- Add new columns to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) DEFAULT 'multi-device' CHECK (game_mode IN ('multi-device', 'single-device')),
ADD COLUMN IF NOT EXISTS turn_timer_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS turn_timer_seconds INTEGER DEFAULT 60 CHECK (turn_timer_seconds >= 10 AND turn_timer_seconds <= 300),
ADD COLUMN IF NOT EXISTS turn_started_at TIMESTAMPTZ;

-- Update existing rooms to have default values
UPDATE rooms 
SET 
  game_mode = 'multi-device',
  turn_timer_enabled = false,
  turn_timer_seconds = 60
WHERE game_mode IS NULL;

-- Create index for faster queries on game_mode
CREATE INDEX IF NOT EXISTS idx_rooms_game_mode ON rooms(game_mode);

-- Comment: turn_started_at will be set when a game starts or when a turn advances

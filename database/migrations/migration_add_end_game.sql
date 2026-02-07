-- Migration to add 'end_game' to move_type check constraint
-- Run this in Supabase SQL Editor

-- 1. Drop the existing constraint
ALTER TABLE moves DROP CONSTRAINT IF EXISTS moves_move_type_check;

-- 2. Add the new constraint with 'end_game' included
ALTER TABLE moves 
ADD CONSTRAINT moves_move_type_check 
CHECK (move_type IN ('word', 'skip', 'swap', 'end_game'));

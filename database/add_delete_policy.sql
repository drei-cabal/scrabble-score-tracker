-- Run this SQL in your Supabase SQL Editor to enable DELETE operations on moves table
-- This is required for the undo functionality to work properly with realtime updates

DROP POLICY IF EXISTS "Allow public delete on moves" ON moves;
CREATE POLICY "Allow public delete on moves" ON moves FOR DELETE USING (true);

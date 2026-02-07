-- Add is_paused column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- Add index for performance (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_rooms_is_paused ON rooms(is_paused);

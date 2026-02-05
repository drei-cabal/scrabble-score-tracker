-- Migration to update room_code length from 4 to 5 characters
-- We'll increase it to 10 to be safe for future changes

-- Update rooms table
ALTER TABLE rooms ALTER COLUMN room_code TYPE VARCHAR(10);

-- Update players table
ALTER TABLE players ALTER COLUMN room_code TYPE VARCHAR(10);

-- Update moves table
ALTER TABLE moves ALTER COLUMN room_code TYPE VARCHAR(10);

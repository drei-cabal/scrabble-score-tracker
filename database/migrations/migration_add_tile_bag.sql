ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tile_bag JSONB DEFAULT '{
    "A": 9, "B": 2, "C": 2, "D": 4, "E": 12, "F": 2, "G": 3, "H": 2, "I": 9, "J": 1, "K": 1, "L": 4, "M": 2, "N": 6, "O": 8, "P": 2, "Q": 1, "R": 6, "S": 4, "T": 6, "U": 4, "V": 2, "W": 2, "X": 1, "Y": 2, "Z": 1, "BLANK": 2
}'::jsonb;

ALTER TABLE moves ADD COLUMN IF NOT EXISTS move_details JSONB;

-- Comment describing the column
COMMENT ON COLUMN rooms.tile_bag IS 'The current inventory of tiles remaining in the bag';
COMMENT ON COLUMN moves.move_details IS 'JSON representation of the tiles used in the move';

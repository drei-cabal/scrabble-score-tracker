-- Atomic Move Submission Function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION submit_move_atomic(
  p_room_code VARCHAR,
  p_player_id UUID,
  p_word VARCHAR,
  p_points INTEGER,
  p_details JSONB,
  p_new_bag JSONB,
  p_next_turn INTEGER,
  p_turn_started_at TIMESTAMPTZ
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- 1. Insert move
  INSERT INTO moves (room_code, player_id, word_played, points_scored, move_type, move_details)
  VALUES (p_room_code, p_player_id, p_word, p_points, 'word', p_details);
  
  -- 2. Update player score
  UPDATE players 
  SET total_score = total_score + p_points
  WHERE id = p_player_id;
  
  -- 3. Update room (tile bag + turn)
  UPDATE rooms 
  SET 
    current_turn_index = p_next_turn,
    tile_bag = p_new_bag,
    turn_started_at = p_turn_started_at
  WHERE room_code = p_room_code;
  
  -- Return success
  SELECT json_build_object(
    'success', true,
    'nextTurnIndex', p_next_turn
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Atomic Undo Function
CREATE OR REPLACE FUNCTION undo_move_atomic(
  p_room_code VARCHAR,
  p_move_id UUID,
  p_player_id UUID,
  p_points_to_revert INTEGER,
  p_restored_bag JSONB,
  p_prev_turn_index INTEGER
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- 1. Revert player score
  UPDATE players 
  SET total_score = GREATEST(0, total_score - p_points_to_revert)
  WHERE id = p_player_id;
  
  -- 2. Update room state
  UPDATE rooms 
  SET 
    current_turn_index = p_prev_turn_index,
    tile_bag = p_restored_bag,
    turn_started_at = NOW()
  WHERE room_code = p_room_code;
  
  -- 3. Delete move
  DELETE FROM moves WHERE id = p_move_id;
  
  -- Return success
  SELECT json_build_object('success', true) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

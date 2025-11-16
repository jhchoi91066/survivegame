// Apply the fix directly using service role
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// We need service role key to execute DDL, but let's try with anon key first
const supabase = createClient(supabaseUrl, supabaseKey);

const fixSQL = `
CREATE OR REPLACE FUNCTION join_multiplayer_room(
  p_room_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_players INTEGER;
  v_max_players INTEGER;
  v_username TEXT;
  v_already_joined BOOLEAN;
BEGIN
  -- RLS validation: user can only join for themselves
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot join room for another user';
  END IF;

  -- Check if user already joined this room
  SELECT EXISTS(
    SELECT 1 FROM multiplayer_game_states
    WHERE room_id = p_room_id AND user_id = p_user_id
  ) INTO v_already_joined;

  -- Lock the room row to prevent race conditions
  SELECT current_players, max_players
  INTO v_current_players, v_max_players
  FROM multiplayer_rooms
  WHERE id = p_room_id
  FOR UPDATE;

  -- Check room exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Check room capacity (only if not already joined)
  IF NOT v_already_joined AND v_current_players >= v_max_players THEN
    RAISE EXCEPTION 'Room is full';
  END IF;

  -- Get username from profiles table
  SELECT username INTO v_username
  FROM profiles
  WHERE id = p_user_id;

  -- Increment current_players atomically ONLY if user hasn't joined before
  IF NOT v_already_joined THEN
    UPDATE multiplayer_rooms
    SET current_players = current_players + 1,
        updated_at = NOW()
    WHERE id = p_room_id;
  END IF;

  -- Insert or update game state with reconnect token
  INSERT INTO multiplayer_game_states (
    room_id,
    user_id,
    username,
    connection_status,
    reconnect_token,
    last_seen
  )
  VALUES (
    p_room_id,
    p_user_id,
    COALESCE(v_username, 'Player'),
    'connected',
    gen_random_uuid()::text,
    NOW()
  )
  ON CONFLICT (room_id, user_id) DO UPDATE
  SET connection_status = 'connected',
      last_seen = NOW(),
      reconnect_token = COALESCE(
        multiplayer_game_states.reconnect_token,
        gen_random_uuid()::text
      ),
      updated_at = NOW();

  -- Insert or update presence record
  INSERT INTO player_presence (user_id, room_id, status, last_heartbeat)
  VALUES (p_user_id, p_room_id, 'online', NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET room_id = p_room_id,
      last_heartbeat = NOW(),
      status = 'online',
      created_at = NOW();
END;
$$;
`;

async function applyFix() {
  console.log('Applying fix to join_multiplayer_room function...\n');

  const { data, error } = await supabase.rpc('exec_sql', { sql: fixSQL });

  if (error) {
    console.error('❌ Error applying fix (anon key insufficient):');
    console.error(error);
    console.log('\n📝 Please copy the SQL from apply_fix_directly.sql');
    console.log('   and run it in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/yqngfoowohacuozaofyb/sql');
    return;
  }

  console.log('✅ Fix applied successfully!');
  console.log(data);
}

applyFix().catch(console.error);

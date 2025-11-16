// Debug script to check multiplayer rooms state
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRooms() {
  console.log('=== Checking Multiplayer Rooms ===\n');

  // Get all waiting rooms
  const { data: rooms, error: roomsError } = await supabase
    .from('multiplayer_rooms')
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false });

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError);
    return;
  }

  console.log(`Found ${rooms.length} waiting rooms:\n`);

  for (const room of rooms) {
    console.log(`Room ID: ${room.id}`);
    console.log(`  Game Type: ${room.game_type}`);
    console.log(`  Current Players (DB): ${room.current_players}`);
    console.log(`  Max Players: ${room.max_players}`);
    console.log(`  Created At: ${room.created_at}`);

    // Get actual player count from game_states
    const { data: gameStates, error: gsError } = await supabase
      .from('multiplayer_game_states')
      .select('user_id, username')
      .eq('room_id', room.id);

    if (!gsError && gameStates) {
      console.log(`  Actual Players (game_states): ${gameStates.length}`);
      gameStates.forEach((gs, i) => {
        console.log(`    Player ${i + 1}: ${gs.username} (${gs.user_id})`);
      });
    }

    console.log(`  ❌ MISMATCH: ${room.current_players} != ${gameStates?.length || 0}\n`);
  }

  console.log('=== Debug Complete ===');
}

checkRooms().catch(console.error);

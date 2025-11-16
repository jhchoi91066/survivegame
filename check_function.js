// Check if the join_multiplayer_room function was updated
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFunction() {
  const { data, error } = await supabase
    .rpc('pg_get_functiondef', {
      func: 'join_multiplayer_room(uuid,uuid)'
    });

  if (error) {
    console.error('Error:', error);

    // Try alternative method
    const { data: migrations } = await supabase
      .from('schema_migrations')
      .select('*')
      .order('version', { ascending: false })
      .limit(5);

    console.log('\nRecent migrations:');
    console.log(migrations);
    return;
  }

  console.log('Function definition retrieved');
  console.log(data);

  // Check if it contains the fix
  const hasFix = data && data.includes('v_already_joined');
  console.log('\n✅ Function contains fix (v_already_joined check):', hasFix);
}

checkFunction().catch(console.error);

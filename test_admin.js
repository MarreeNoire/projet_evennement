const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

console.log('SUPABASE URL:', env.NEXT_PUBLIC_SUPABASE_URL);
console.log('ANON KEY prefix:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 15));
console.log('SERVICE ROLE KEY prefix:', env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 15));

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  const { data, error } = await admin.from('events').select('id, title, status').limit(2);
  console.log('Admin select events result:', { data, error });
})();

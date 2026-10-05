const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: profiles } = await admin.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5);
  console.log('Recent profiles:', profiles);

  // Let's test insert using admin client:
  const testEvent = {
    organization_id: '8cc92584-b11a-402e-9897-08e6563c054f',
    created_by: 'c31aa07e-b328-4271-a407-72853d2091e2',
    title: 'Test RLS event',
    slug: 'test-rls-' + Date.now(),
    category: 'culture',
    city: 'Abidjan',
    start_at: new Date(Date.now() + 86400000).toISOString(),
    end_at: new Date(Date.now() + 172800000).toISOString(),
    status: 'draft',
    salon_privacy: 'members',
    currency: 'XOF',
    capacity: 100,
    min_price: 1000,
    max_price: 1000
  };

  const { data: insertedEvent, error: insertErr } = await admin.from('events').insert(testEvent).select().single();
  console.log('Admin insert event:', { insertedEvent: insertedEvent?.id, insertErr });

  if (insertedEvent?.id) {
    // Clean up
    await admin.from('events').delete().eq('id', insertedEvent.id);
    console.log('Cleaned up test event.');
  }
})();

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
  const orgId = '8cc92584-b11a-402e-9897-08e6563c054f';
  const userId = 'c31aa07e-b328-4271-a407-72853d2091e2';

  const { data: canManage, error: errManage } = await admin.rpc('can_manage_org', { org_id: orgId, user_id: userId });
  console.log('can_manage_org test:', { canManage, errManage });

  const { data: canCreate, error: errCreate } = await admin.rpc('can_create_event_in_org', { p_organization_id: orgId, p_user_id: userId });
  console.log('can_create_event_in_org test:', { canCreate, errCreate });
})();

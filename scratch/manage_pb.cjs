const PB_URL = 'https://suprima-platform-pb.fly.dev';
const ADMIN_EMAIL = 'chrisklee69@gmail.com';
const ADMIN_PASSWORD = 'aussie1996@@';

async function main() {
  console.log('1. Logging in as Admin...');
  const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!authRes.ok) {
    console.error('Admin authentication failed:', await authRes.text());
    return;
  }

  const authData = await authRes.json();
  const token = authData.token;
  console.log('Admin login success.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const suprimaCollections = [
    'suprima_licenses',
    'suprima_profiles',
    'suprima_students',
    'suprima_pdf_analyses',
    'suprima_exploration_library'
  ];

  console.log('\n=== Collection Health Check ===');
  for (const name of suprimaCollections) {
    const res = await fetch(`${PB_URL}/api/collections/${name}/records?perPage=1`, { headers });
    if (res.ok) {
      const data = await res.json();
      console.log(`- ${name}: ${data.totalItems} records`);
    } else {
      console.log(`- ${name}: FAILED TO FETCH (${res.status} - ${await res.text()})`);
    }
  }

  // Also check users
  const usersRes = await fetch(`${PB_URL}/api/collections/users/records?perPage=1`, { headers });
  if (usersRes.ok) {
    const data = await usersRes.json();
    console.log(`- users: ${data.totalItems} records`);
  }
}

main().catch(console.error);

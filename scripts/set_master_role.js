// set_master_role.js
// Run once to force current logged‑in user to have role "master"
import { pb } from '../src/lib/pocketbase';

(async () => {
  const user = pb.authStore?.model;
  if (!user) {
    console.error('No user logged in.');
    return;
  }
  try {
    await pb.collection('suprima_profiles').update(user.id, { role: 'master' });
    console.log(`User ${user.id} role set to master.`);
  } catch (e) {
    console.error('Failed to set role:', e);
  }
})();

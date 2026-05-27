import PocketBase from 'pocketbase';
const pb = new PocketBase('https://suprima-platform-pb.fly.dev');
async function test() {
  try {
    const authData = await pb.collection('users').authWithPassword('chrisklee69@gmail.com', 'aussie1996@@@');
    console.log('Login successful', pb.authStore.isValid);
    
    const userId = String(pb.authStore.model.id ?? '');
    
    let linked = await pb.collection('suprima_profiles').getFirstListItem(`admin_id="${userId}"`).catch(() => null);
    console.log('linked step 1', linked);
    
    if (!linked) {
      linked = await pb.collection('suprima_profiles').getFirstListItem(`user="${userId}"`).catch(() => null);
      console.log('linked step 2', linked);
    }
    
    if (!linked) {
      console.log('creating profile...');
      const licenses = await pb
        .collection('suprima_licenses')
        .getFullList({ filter: 'active=true', sort: '-updated,-created' })
        .catch(e => { console.log('license err', e); return []; });
        
      const academyId = (licenses[0] || {}).academy_id || '';
      console.log('academyId', academyId);
      
      const created = await pb.collection('suprima_profiles').create({
        user: userId,
        admin_id: userId,
        name: 'test',
        full_name: 'test',
        role: 'consultant',
        academy_id: academyId,
      }).catch(e => { console.log('create err', e); return null; });
      console.log('created', !!created);
    }
  } catch (e) {
    console.log('Login failed:', e.message, e.response);
  }
}
test();

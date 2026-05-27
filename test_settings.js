import PocketBase from 'pocketbase';
const pb = new PocketBase('https://suprima-platform-pb.fly.dev');
async function test() {
  try {
    await pb.collection('users').authWithPassword('chrisklee69@gmail.com', 'aussie1996@@@');
    try {
      const records = await pb.collection('suprima_settings').getList(1, 1);
      console.log('suprima_settings exists:', records);
    } catch (e) {
      console.log('suprima_settings error:', e.message);
    }
  } catch (err) {
    console.error('Auth Error:', err.message);
  }
}
test();

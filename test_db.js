import PocketBase from 'pocketbase';
const pb = new PocketBase('https://suprima-platform-pb.fly.dev');
async function test() {
  try {
    await pb.collection('users').authWithPassword('chrisklee69@gmail.com', 'aussie1996@@@');
    console.log('Login success');
    const records = await pb.collection('suprima_students').getList(1, 1);
    if (records.items.length > 0) {
      const studentId = records.items[0].id;
      console.log('Testing update on student:', studentId);
      try {
        await pb.collection('suprima_students').update(studentId, {
          hope_major: '컴퓨터공학'
        });
        console.log('Update success! Field hope_major is supported.');
      } catch (updateErr) {
        console.log('Update failed:', updateErr.message);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();

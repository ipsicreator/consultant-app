async function run() {
  const url = 'https://suprima-platform-pb.fly.dev/api/admins/auth-with-password';
  try {
    console.log('Sending raw POST request to admin auth...');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: 'chrisklee69@gmail.com', password: 'aussie1996@@' })
    });
    console.log('Response status:', res.status);
    console.log('Response text:', await res.text());
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
run();

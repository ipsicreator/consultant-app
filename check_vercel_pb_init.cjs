const https = require('https');

https.get('https://consultantapp.vercel.app/', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (match) {
      https.get('https://consultantapp.vercel.app' + match[1], res2 => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          // Look for: new PocketBase("url") or new Something("url")
          // Since it's minified, let's just find what comes before fly.dev
          const idx = data2.indexOf('fly.dev');
          if (idx !== -1) {
            console.log(data2.substring(idx - 50, idx + 50));
          } else {
            console.log('fly.dev not found');
          }
        });
      });
    } else {
      console.log('No JS bundle found');
    }
  });
});

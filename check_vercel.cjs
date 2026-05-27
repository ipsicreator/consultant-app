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
          const pbMatch = data2.match(/https?:\/\/[^"]*fly\.dev[^"]*|https?:\/\/[^"]*pocketbase[^"]*/g);
          console.log(pbMatch ? [...new Set(pbMatch)] : 'No pocketbase URL found');
        });
      });
    } else {
      console.log('No JS bundle found');
    }
  });
});

const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'dist');
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.json':'application/json'};
const server = http.createServer((req,res)=>{
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(root, urlPath === '/' ? '/index.html' : urlPath);
  if (!filePath.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) filePath = path.join(root, 'index.html');
    fs.readFile(filePath, (e, data) => {
      if (e) { res.writeHead(404); return res.end('Not found'); }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {'Content-Type': mime[ext] || 'application/octet-stream'});
      res.end(data);
    });
  });
});
server.listen(4173, '127.0.0.1', ()=> console.log('dist server on http://127.0.0.1:4173'));

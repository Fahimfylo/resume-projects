const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "no health endpoint"', (e, s) => {
    let o = '';
    s.on('data', d => o += d);
    s.on('close', () => { console.log(o.trim()); conn.end(); process.exit(0); });
  });
}).on('error', e => { console.error(e.message); process.exit(1); })
.connect({ host: '109.199.103.178', username: 'root', password: 'nEwRoo7t', readyTimeout: 15000 });

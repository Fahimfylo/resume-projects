const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const scriptPath = path.join(__dirname, 'scripts/populateCompaniesCacheBatch.js');
const content = fs.readFileSync(scriptPath, 'utf-8');
const b64 = Buffer.from(content, 'utf-8').toString('base64');

const c = new Client();
c.on('ready', () => {
  const cmd = `echo "${b64}" | base64 -d > /var/PROSPCT/server/scripts/populateCompaniesCacheBatch.js && rm -f /var/PROSPCT/tmp/companies_batch_checkpoint.json && cd /var/PROSPCT && screen -dmS companies-batch node server/scripts/populateCompaniesCacheBatch.js && echo "STARTED"`;
  c.exec(cmd, (e, s) => {
    let o = '';
    s.on('data', d => o += d);
    s.on('close', () => {
      console.log(o.trim());
        setTimeout(() => {
        c.exec('screen -S companies-batch -X hardcopy /tmp/screen_log_new.txt; grep -v "^$" /tmp/screen_log_new.txt', (e2, s2) => {
          let o2 = '';
          s2.on('data', d => o2 += d);
          s2.on('close', () => { console.log(o2.trim()); c.end(); });
        });
      }, 5000);
    });
  });
}).on('error', e => { console.error(e.message); process.exit(1); })
.connect({ host: '109.199.103.178', username: 'root', password: 'nEwRoo7t', readyTimeout: 20000 });

const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const scriptPath = path.join(__dirname, 'scripts/populateCompaniesCacheAgg.js');
const content = fs.readFileSync(scriptPath, 'utf-8');
const b64 = Buffer.from(content, 'utf-8').toString('base64');

const c = new Client();
c.on('ready', () => {
  const cmds = [
    `echo "${b64}" | base64 -d > /var/PROSPCT/server/scripts/populateCompaniesCacheAgg.js`,
    `rm -f /var/PROSPCT/tmp/companies_agg_checkpoint.json`,
    `cd /var/PROSPCT && screen -dmS companies-agg node server/scripts/populateCompaniesCacheAgg.js`,
    `echo DONE`
  ].join(' && ');

  c.exec(cmds, (e, s) => {
    let o = '';
    s.on('data', d => o += d);
    s.on('close', () => {
      console.log(o.trim());
      setTimeout(() => {
        c.exec('screen -ls | grep companies-agg; echo "---"; cat /var/PROSPCT/tmp/companies_agg_checkpoint.json 2>/dev/null || echo "no checkpoint"', (e2, s2) => {
          let o2 = '';
          s2.on('data', d => o2 += d);
          s2.on('close', () => { console.log(o2.trim()); c.end(); });
        });
      }, 3000);
    });
  });
}).on('error', e => { console.error(e.message); process.exit(1); })
.connect({ host: '109.199.103.178', username: 'root', password: 'nEwRoo7t', readyTimeout: 30000 });

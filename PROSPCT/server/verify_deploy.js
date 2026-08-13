const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const HOST = '109.199.103.178';
const USER = 'root';
const PASS = 'nEwRoo7t';

function execCmd(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) { reject(err); return; }
      let out = '';
      stream.on('data', d => out += d);
      stream.on('close', () => resolve(out.trim()));
      stream.stderr.on('data', d => out += d);
    });
  });
}

async function main() {
  const conn = new Client();
  conn.on('ready', async () => {
    try {
      // 1. Health check
      console.log('=== Health Check ===');
      const healthPorts = ['5030', '5000', '5001'];
      let healthOk = false;
      for (const port of healthPorts) {
        const res = await execCmd(conn, `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/api/health 2>/dev/null`);
        if (res && res !== '000') {
          console.log(`Server on port ${port} responded: ${res}`);
          healthOk = true;
          break;
        }
      }
      if (!healthOk) {
        // Try pm2 list to check status
        const pm2Status = await execCmd(conn, 'pm2 jlist');
        const parsed = JSON.parse(pm2Status);
        const app = parsed.find(p => p.name === 'prospct-backend');
        if (app) {
          console.log(`PM2 status: ${app.pm2_env.status}, port: ${app.pm2_env.port || 'N/A'}`);
        }
      }

      // 2. Check indexes
      console.log('\n=== Indexes on contacts_v5 ===');
      const indexes = await execCmd(conn, `mongosh "mongodb://ProspctAdmin:Prospct.io%40007@127.0.0.1:27017/prospct?authSource=admin" --quiet --eval "db.contacts_v5.getIndexes().forEach(idx => print(idx.name));"`);
      console.log(indexes);

      // 3. Check that new indexes exist
      const hasCompound = indexes.includes('_source.person_location_country_1__source.person_seniority_1__source.person_email_status_cd_1');
      const hasIndustry = indexes.includes('_source.organization_industries_1__source.person_location_country_1');
      console.log(`\nNew country+seniority+email_status index: ${hasCompound ? 'PRESENT' : 'MISSING'}`);
      console.log(`New industry+country index: ${hasIndustry ? 'PRESENT' : 'MISSING'}`);

      // 4. Check search endpoint responds
      console.log('\n=== Search API Test ===');
      const searchRes = await execCmd(conn, `curl -s -X POST http://localhost:5030/api/search -H "Content-Type: application/json" -d '{"filters":{"country":["United States"]},"limit":1}' | head -c 200`);
      console.log(searchRes.substring(0, 200));

    } catch (err) {
      console.error('Error:', err.message);
    }
    conn.end();
  });
  conn.on('error', e => { console.error('SSH error:', e.message); process.exit(1); });
  conn.connect({ host: HOST, username: USER, password: PASS, readyTimeout: 30000 });
}

main();

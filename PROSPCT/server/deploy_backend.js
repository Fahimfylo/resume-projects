const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const files = [
  { local: path.join(__dirname, 'models', 'Account.js'),         remote: '/var/PROSPCT/server/models/Account.js' },
  { local: path.join(__dirname, 'models', 'Member.js'),          remote: '/var/PROSPCT/server/models/Member.js' },
  { local: path.join(__dirname, 'models', 'User.js'),            remote: '/var/PROSPCT/server/models/User.js' },
  { local: path.join(__dirname, 'models', 'ImportedContact.js'), remote: '/var/PROSPCT/server/models/ImportedContact.js' },
  { local: path.join(__dirname, 'models', 'SavedItem.js'),       remote: '/var/PROSPCT/server/models/SavedItem.js' },
];

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err.message); conn.end(); return; }

    let idx = 0;
    const next = () => {
      if (idx >= files.length) {
        console.log('All files uploaded');
        sftp.end();
        conn.exec('pm2 restart prospct-backend', (e, s) => {
          let o = '';
          s.on('data', d => o += d);
          s.on('close', () => {
            console.log('Restart result:', o.trim());

            // Now check indexes
            conn.exec(`mongosh "mongodb://ProspctAdmin:Prospct.io%40007@127.0.0.1:27017/prospct?authSource=admin" --quiet --eval "db.contacts_v5.getIndexes().forEach(idx => print(idx.name));"`, (e2, s2) => {
              let o2 = '';
              s2.on('data', d => o2 += d);
              s2.on('close', () => {
                console.log('Indexes on contacts_v5:');
                console.log(o2.trim());
                conn.end();
              });
            });
          });
        });
        return;
      }

      const f = files[idx];
      const content = fs.readFileSync(f.local);
      const ws = sftp.createWriteStream(f.remote);
      ws.on('close', () => { console.log('Uploaded:', f.remote); idx++; next(); });
      ws.on('error', (e) => { console.error('Error:', e.message); idx++; next(); });
      ws.end(content);
    };
    next();
  });
}).on('error', e => { console.error('SSH error:', e.message); process.exit(1); })
.connect({ host: '109.199.103.178', username: 'root', password: 'nEwRoo7t', readyTimeout: 30000 });

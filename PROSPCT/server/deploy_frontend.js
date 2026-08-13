const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const zipPath = path.join(__dirname, '..', 'client', 'dist.zip');
const remotePath = '/tmp/dist.zip';

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err); conn.end(); return; }
    const readStream = fs.createReadStream(zipPath);
    const writeStream = sftp.createWriteStream(remotePath);
    writeStream.on('close', () => {
      console.log('Uploaded dist.zip');
      conn.exec('rm -rf /var/PROSPCT/client/dist/* && cd /var/PROSPCT/client/dist && unzip -o /tmp/dist.zip && rm /tmp/dist.zip', (e, s) => {
        let o = '';
        s.on('data', d => o += d);
        s.on('close', () => { console.log(o.trim()); conn.end(); });
      });
    });
    readStream.pipe(writeStream);
  });
}).connect({ host: '109.199.103.178', username: 'root', password: 'nEwRoo7t', readyTimeout: 30000 });

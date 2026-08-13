const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// The JS file to upload and execute on VPS
const remoteScript = `
var cols = ['accounts','members','contacts_imported','import_batches','users','savedcols'];
cols = ['accounts','members','contacts_imported','import_batches','users','savedcontacts'];
cols.forEach(function(c) {
  print('=== ' + c + ' ===');
  var idxs = db[c].getIndexes();
  if (idxs.length <= 1) {
    print('  (only _id)');
  } else {
    idxs.forEach(function(idx) {
      if (idx.name !== '_id_') print('  ' + idx.name + ' ' + JSON.stringify(idx.key));
    });
  }
});
`;

const tmpLocal = path.join(__dirname, '_verify_tmp.js');
const remotePath = '/tmp/_verify_indexes.js';

fs.writeFileSync(tmpLocal, remoteScript);

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err.message); conn.end(); return; }
    const ws = sftp.createWriteStream(remotePath);
    ws.on('close', () => {
      console.log('Script uploaded');
      const cmd = `mongosh "mongodb://ProspctAdmin:Prospct.io%40007@127.0.0.1:27017/prospct?authSource=admin" --quiet ${remotePath}`;
      conn.exec(cmd, (e, s) => {
        let o = '';
        let errOut = '';
        s.on('data', d => o += d);
        s.stderr.on('data', d => errOut += d);
        s.on('close', () => {
          console.log(o);
          if (errOut) console.error(errOut);
          // cleanup
          conn.exec(`rm ${remotePath}`, () => {
            conn.end();
            try { fs.unlinkSync(tmpLocal); } catch(e) {}
          });
        });
      });
    });
    ws.end(fs.readFileSync(tmpLocal));
  });
}).connect({ host: '109.199.103.178', username: 'root', password: 'nEwRoo7t', readyTimeout: 10000 });

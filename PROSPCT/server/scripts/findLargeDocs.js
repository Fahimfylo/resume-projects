const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 });
  const coll = mongoose.connection.db.collection('contacts_v5');

  // Sample: find first 100 docs and check for large string fields
  const cursor = coll.find({}).sort({ _id: 1 }).limit(100);
  for await (const doc of cursor) {
    const source = doc._source || {};
    for (const [key, val] of Object.entries(source)) {
      if (val && typeof val === 'string' && val.length > 50000) {
        console.log(`ID: ${doc._id} | field: ${key} | length: ${val.length} | preview: ${val.substring(0, 200)}`);
      }
      if (val && typeof val === 'object') {
        const str = JSON.stringify(val);
        if (str.length > 50000) {
          console.log(`ID: ${doc._id} | field: ${key} (object) | size: ${(str.length / 1024 / 1024).toFixed(2)} MB | type: ${Array.isArray(val) ? 'array' : 'object'}`);
        }
      }
    }
  }
  console.log('Scanned first 100 docs');

  // Also check a few docs near the boundary (first doc)
  const boundary = await coll.findOne({ _id: { $gte: '0023d8a9-c97a-4553-b308-8b4a5ffe1b99' } }).sort({ _id: 1 });
  if (boundary) {
    const source = boundary._source || {};
    for (const [key, val] of Object.entries(source)) {
      if (val && typeof val === 'string' && val.length > 50000) {
        console.log(`BOUNDARY ID: ${boundary._id} | field: ${key} | length: ${val.length}`);
      }
      if (val && typeof val === 'object') {
        const str = JSON.stringify(val).substring(0, 500);
        console.log(`BOUNDARY ID: ${boundary._id} | field: ${key} | type: ${Array.isArray(val) ? 'array[' + val.length + ']' : 'object'} | preview: ${str}`);
      }
    }
  }

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });

const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://ProspctAdmin:Prospct.io%40007@127.0.0.1:27017/prospct?authSource=admin', { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const coll = db.collection('contacts_v5');

  // Test 1: How many contacts have fb_url that is NOT null, not empty, not string "null"
  const pipeline = [
    { $match: { '_source.sanitized_organization_name_unanalyzed': { $exists: true, $nin: [null, ''] } } },
    { $match: {
        $or: [
          { '_source.organization_facebook_url': { $exists: true, $nin: [null, '', 'null'] } },
          { '_source.organization_twitter_url': { $exists: true, $nin: [null, '', 'null'] } },
        ]
    } },
    { $limit: 100000 },
    { $group: {
        _id: '$_source.sanitized_organization_name_unanalyzed',
        fb: { $max: '$_source.organization_facebook_url' },
        tw: { $max: '$_source.organization_twitter_url' },
        count: { $sum: 1 }
    } },
    { $match: {
        $or: [
          { fb: { $exists: true, $nin: [null, '', 'null'] } },
          { tw: { $exists: true, $nin: [null, '', 'null'] } },
        ]
    } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ];

  const start = Date.now();
  const result = await coll.aggregate(pipeline, { allowDiskUse: true }).toArray();
  const elapsed = ((Date.now() - start) / 1000).toFixed(0);

  console.log(`Elapsed: ${elapsed}s`);
  console.log(`Results: ${result.length}`);
  result.forEach(r => console.log(`  ${r._id}: fb="${r.fb?.substring(0, 50)}" tw="${r.tw?.substring(0, 50)}" contacts=${r.count}`));

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });

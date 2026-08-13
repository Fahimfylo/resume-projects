const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://ProspctAdmin:Prospct.io%40007@127.0.0.1:27017/prospct?authSource=admin';

async function run() {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 0,
  });

  const db = mongoose.connection.db;
  const cacheColl = db.collection('companies_cache');

  const total = await cacheColl.countDocuments({});
  console.log(`Total companies_cache docs: ${total}`);

  console.log('\nRunning $lookup + $merge aggregation to backfill social links...');
  const aggStart = Date.now();

  await cacheColl.aggregate([
    {
      $lookup: {
        from: 'contacts_v5',
        let: { orgName: '$sanitized_organization_name_unanalyzed' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_source.sanitized_organization_name_unanalyzed', '$$orgName'] } } },
          {
            $match: {
              $or: [
                { '_source.organization_facebook_url': { $nin: [null, '', 'null'] } },
                { '_source.organization_twitter_url': { $nin: [null, '', 'null'] } },
              ],
            },
          },
          { $limit: 1 },
          { $project: { _id: 0, fb: '$_source.organization_facebook_url', tw: '$_source.organization_twitter_url' } },
        ],
        as: 'contact',
      },
    },
    { $match: { contact: { $ne: [] } } },
    {
      $project: {
        _id: 1,
        organization_facebook_url: { $ifNull: [{ $arrayElemAt: ['$contact.fb', 0] }, '$organization_facebook_url'] },
        organization_twitter_url: { $ifNull: [{ $arrayElemAt: ['$contact.tw', 0] }, '$organization_twitter_url'] },
      },
    },
    {
      $merge: {
        into: 'companies_cache',
        on: '_id',
        whenMatched: 'merge',
        whenNotMatched: 'fail',
      },
    },
  ], { allowDiskUse: true }).toArray();

  console.log(`Done in ${((Date.now() - aggStart) / 1000).toFixed(0)}s`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

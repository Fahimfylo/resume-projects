const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGO_URI = 'mongodb://ProspctAdmin:Prospct.io%40007@127.0.0.1:27017/prospct?authSource=admin';
const CHECKPOINT_DIR = '/var/PROSPCT/tmp';
const CHECKPOINT_FILE = path.join(CHECKPOINT_DIR, 'companies_agg_checkpoint.json');

const CHUNK_SIZE = 1000000;

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.stack || err.message || err);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.stack || err.message || err);
  process.exit(1);
});

function dedupKeyExpr() {
  const toSafeString = (field) => ({
    $convert: { input: field, to: 'string', onError: '', onNull: '' }
  });

  const domainNormalized = {
    $toLower: {
      $trim: { input: toSafeString('$_source.organization_domain') }
    }
  };

  return {
    $cond: {
      if: { $ne: [{ $ifNull: ['$_source.organization_id', ''] }, ''] },
      then: { $concat: ['id:', toSafeString('$_source.organization_id')] },
      else: {
        $cond: {
          if: { $ne: [{ $ifNull: ['$_source.organization_domain', ''] }, ''] },
          then: { $concat: ['domain:', domainNormalized] },
          else: {
            $cond: {
              if: { $ne: [{ $ifNull: ['$_source.sanitized_organization_name_unanalyzed', ''] }, ''] },
              then: { $concat: ['name:', { $trim: { input: { $toLower: toSafeString('$_source.sanitized_organization_name_unanalyzed') } } }] },
              else: null
            }
          }
        }
      }
    }
  };
}

function makeGroupPipeline(matchFilter) {
  return [
    { $match: matchFilter },
    { $addFields: { dedupKey: dedupKeyExpr() } },
    { $match: { dedupKey: { $ne: null } } },
    {
      $group: {
        _id: '$dedupKey',
        _contactCount: { $sum: 1 },
        sanitized_organization_name_unanalyzed: { $first: '$_source.sanitized_organization_name_unanalyzed' },
        organization_name: { $first: '$_source.organization_name' },
        organization_domain: { $first: '$_source.organization_domain' },
        organization_id: { $first: '$_source.organization_id' },
        organization_hq_location_country: { $first: '$_source.organization_hq_location_country' },
        organization_hq_location_city: { $first: '$_source.organization_hq_location_city' },
        organization_hq_location_state: { $first: '$_source.organization_hq_location_state' },
        organization_hq_location_postal_code: { $first: { $ifNull: ['$_source.organization_hq_location_postal_code', '$_source.zipPostal'] } },
        organization_industries: { $first: '$_source.organization_industries' },
        organization_num_current_employees: { $first: '$_source.organization_num_current_employees' },
        organization_founded_year: { $first: '$_source.organization_founded_year' },
        organization_website_url: { $first: '$_source.organization_website_url' },
        organization_linkedin_url: { $first: '$_source.organization_linkedin_url' },
        organization_revenue_in_thousands_int: { $first: '$_source.organization_revenue_in_thousands_int' },
        organization_relevant_keywords: { $first: '$_source.organization_relevant_keywords' },
        organization_facebook_url: { $first: '$_source.organization_facebook_url' },
        organization_twitter_url: { $first: '$_source.organization_twitter_url' },
      },
    },
    {
      $project: {
        _id: 0,
        dedupKey: '$_id',
        _contactCount: 1,
        sanitized_organization_name_unanalyzed: 1,
        organization_name: 1,
        organization_domain: 1,
        organization_id: 1,
        organization_hq_location_country: 1,
        organization_hq_location_city: 1,
        organization_hq_location_state: 1,
        organization_hq_location_postal_code: 1,
        organization_industries: 1,
        organization_num_current_employees: 1,
        organization_founded_year: 1,
        organization_website_url: 1,
        organization_linkedin_url: 1,
        organization_revenue_in_thousands_int: 1,
        organization_relevant_keywords: 1,
        organization_facebook_url: 1,
        organization_twitter_url: 1,
      },
    },
    {
      $merge: {
        into: 'companies_cache',
        on: 'dedupKey',
        whenMatched: [
          { $set: { _contactCount: { $add: ['$_contactCount', '$$new._contactCount'] } } },
        ],
        whenNotMatched: 'insert',
      },
    },
  ];
}

async function run() {
  fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 300000,
    socketTimeoutMS: 0,
    heartbeatFrequencyMS: 10000,
    connectTimeoutMS: 60000,
  });

  const db = mongoose.connection.db;
  const contactsColl = db.collection('contacts_v5');
  const cacheColl = db.collection('companies_cache');

  let lastId = null;
  let totalProcessed = 0;
  let chunkNum = 0;

  if (fs.existsSync(CHECKPOINT_FILE)) {
    const raw = fs.readFileSync(CHECKPOINT_FILE, 'utf-8');
    const cp = JSON.parse(raw);
    if (cp.lastId) {
      lastId = new mongoose.Types.ObjectId(cp.lastId);
      totalProcessed = cp.totalProcessed || 0;
      chunkNum = cp.chunkNum || 0;
      console.log(`Resumed at _id: ${cp.lastId} (${totalProcessed} docs processed)`);
    }
  }

  if (!lastId) {
    console.log('Starting fresh — dropping companies_cache');
    await cacheColl.drop().catch(() => {});
    console.log('Creating unique dedupKey index for $merge...');
    await cacheColl.createIndex({ dedupKey: 1 }, { unique: true, background: true });
    console.log('Index created.');
  }

  const total = await contactsColl.estimatedDocumentCount();
  console.log(`Total contacts: ${total}`);

  const startTime = Date.now();

  for (; ; chunkNum++) {
    const matchFilter = lastId ? { _id: { $gt: lastId } } : {};
    const boundaryPipeline = [
      { $match: matchFilter },
      { $sort: { _id: 1 } },
      { $limit: CHUNK_SIZE },
      { $group: { _id: null, maxId: { $max: '$_id' }, count: { $sum: 1 } } },
    ];

    const boundaryResult = await contactsColl.aggregate(boundaryPipeline, { allowDiskUse: true }).toArray();

    if (boundaryResult.length === 0) {
      console.log('No more contacts — all done.');
      break;
    }

    const { maxId, count } = boundaryResult[0];

    const chunkStart = Date.now();
    const dataFilter = lastId
      ? { _id: { $gt: lastId, $lte: maxId } }
      : { _id: { $lte: maxId } };

    console.log(`\nChunk ${chunkNum + 1}: ${count} docs (${totalProcessed}/${total})`);

    try {
      const pipeline = makeGroupPipeline(dataFilter);
      console.log('  Running aggregation...');
      const aggStart = Date.now();
      await contactsColl.aggregate(pipeline, { allowDiskUse: true }).toArray();
      console.log(`  Aggregation returned after ${(Date.now() - aggStart) / 1000}s`);
    } catch (err) {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({
        lastId: lastId ? lastId.toString() : null,
        totalProcessed,
        chunkNum,
        error: err.message,
      }));
      console.error(`Chunk ${chunkNum + 1} failed:`, err.message);
      console.error('Checkpoint saved — resume by re-running');
      await mongoose.disconnect();
      process.exit(1);
    }

    totalProcessed += count;
    lastId = maxId;

    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({
      lastId: maxId.toString(),
      totalProcessed,
      chunkNum: chunkNum + 1,
    }));

    const elapsed = ((Date.now() - chunkStart) / 1000).toFixed(1);
    const cacheCount = await cacheColl.estimatedDocumentCount();
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  Done in ${elapsed}s — cache: ${cacheCount} (${totalElapsed}s total)`);

    if (count < CHUNK_SIZE) {
      console.log('Reached end of contacts.');
      break;
    }
  }

  console.log('\nCreating remaining indexes...');
  await cacheColl.createIndex({ dedupKey: 1 }, { unique: true, background: true });
  await cacheColl.createIndex({ sanitized_organization_name_unanalyzed: 1 }, { background: true });
  await cacheColl.createIndex({ organization_domain: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_country: 1 }, { background: true });
  await cacheColl.createIndex({ organization_industries: 1 }, { background: true });
  await cacheColl.createIndex({ organization_num_current_employees: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_city: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_state: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_postal_code: 1 }, { background: true });
  await cacheColl.createIndex({ organization_relevant_keywords: 1 }, { background: true });
  await cacheColl.createIndex({ quality_score: -1, _contactCount: -1 }, { background: true });
  console.log('All indexes created.');

  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }

  const finalCount = await cacheColl.estimatedDocumentCount();
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${finalCount} companies in cache (${totalTime}s)`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

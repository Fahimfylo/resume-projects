const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGO_URI = 'mongodb://ProspctAdmin:Prospct.io%40007@127.0.0.1:27017/prospct?authSource=admin';
const CHECKPOINT_DIR = '/var/PROSPCT/tmp';
const CHECKPOINT_FILE = path.join(CHECKPOINT_DIR, 'companies_batch_checkpoint.json');

const BATCH_SIZE = 500000;
const WRITE_BATCH = 5000;
const LOG_INTERVAL = 50000;

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.stack || err.message || err);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.stack || err.message || err);
  process.exit(1);
});

function parseCheckpoint() {
  if (!fs.existsSync(CHECKPOINT_FILE)) return null;
  return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
}

async function run() {
  fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 0,
    heartbeatFrequencyMS: 60000,
    connectTimeoutMS: 30000,
  });

  const db = mongoose.connection.db;
  const contactsColl = db.collection('contacts_v5');
  const cacheColl = db.collection('companies_cache');

  const cp = parseCheckpoint();
  let lastId = null;
  let totalProcessed = 0;
  let batchNum = 0;

  if (cp && cp.lastId) {
    lastId = new mongoose.Types.ObjectId(cp.lastId);
    totalProcessed = cp.totalProcessed || 0;
    batchNum = cp.batchNum || 0;
    console.log(`Resumed at _id: ${cp.lastId} (${totalProcessed} docs)`);
  } else {
    console.log('Starting fresh — dropping companies_cache');
    await cacheColl.drop().catch(() => {});
  }

  const total = await contactsColl.estimatedDocumentCount();
  console.log(`Total: ${total} | remaining: ${total - totalProcessed}`);

  for (; ; batchNum++) {
    const query = lastId ? { _id: { $gt: lastId } } : {};
    const cursor = contactsColl.find(query, {
      projection: {
        '_source.organization_id': 1,
        '_source.organization_domain': 1,
        '_source.sanitized_organization_name_unanalyzed': 1,
        '_source.organization_name': 1,
        '_source.organization_num_current_employees': 1,
        '_source.organization_industries': 1,
        '_source.organization_hq_location_country': 1,
        '_source.organization_hq_location_city': 1,
        '_source.organization_hq_location_state': 1,
        '_source.organization_hq_location_postal_code': 1,
        '_source.organization_founded_year': 1,
        '_source.organization_website_url': 1,
        '_source.organization_linkedin_url': 1,
        '_source.organization_facebook_url': 1,
        '_source.organization_twitter_url': 1,
        '_source.organization_revenue_in_thousands_int': 1,
        '_source.organization_relevant_keywords': 1,
      },
      sort: { _id: 1 },
      limit: BATCH_SIZE,
      batchSize: 10000,
      noCursorTimeout: true,
    });

    const batchStart = Date.now();
    let docCount = 0;
    const ops = [];

    try {
      for await (const doc of cursor) {
        docCount++;
        totalProcessed++;
        lastId = doc._id;

        const src = doc._source || {};

        let dedupKey = null;
        if (src.organization_id) {
          dedupKey = 'id:' + String(src.organization_id);
        } else if (src.organization_domain) {
          const domain = String(src.organization_domain).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
          dedupKey = 'domain:' + domain;
        } else if (src.sanitized_organization_name_unanalyzed) {
          dedupKey = 'name:' + String(src.sanitized_organization_name_unanalyzed).toLowerCase().trim();
        } else {
          continue;
        }

        ops.push({
          updateOne: {
            filter: { dedupKey },
            update: {
              $set: {
                dedupKey,
                sanitized_organization_name_unanalyzed: src.sanitized_organization_name_unanalyzed || null,
                organization_name: src.organization_name || null,
                organization_domain: src.organization_domain || null,
                organization_id: src.organization_id || null,
                organization_hq_location_country: src.organization_hq_location_country || null,
                organization_hq_location_city: src.organization_hq_location_city || null,
                organization_hq_location_state: src.organization_hq_location_state || null,
                organization_hq_location_postal_code: src.organization_hq_location_postal_code || null,
                organization_industries: src.organization_industries || null,
                organization_num_current_employees: src.organization_num_current_employees || null,
                organization_founded_year: src.organization_founded_year || null,
                organization_website_url: src.organization_website_url || null,
                organization_linkedin_url: src.organization_linkedin_url || null,
                organization_facebook_url: src.organization_facebook_url || null,
                organization_twitter_url: src.organization_twitter_url || null,
                organization_revenue_in_thousands_int: src.organization_revenue_in_thousands_int || null,
                organization_relevant_keywords: src.organization_relevant_keywords || null,
              },
              $inc: { _contactCount: 1 },
            },
            upsert: true,
          },
        });

        if (ops.length >= WRITE_BATCH) {
          await cacheColl.bulkWrite(ops, { ordered: false });
          ops.length = 0;
        }

        if (docCount % LOG_INTERVAL === 0) {
          console.log(`  batch ${batchNum + 1}: ${docCount} docs (${totalProcessed}/${total})`);
        }
      }

      if (ops.length > 0) {
        await cacheColl.bulkWrite(ops, { ordered: false });
      }

      const elapsed = ((Date.now() - batchStart) / 1000).toFixed(1);
      const count = await cacheColl.estimatedDocumentCount();
      console.log(`Batch ${batchNum + 1} done: ${docCount} docs in ${elapsed}s — cache: ${count}`);

      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({
        lastId: lastId ? lastId.toString() : null,
        totalProcessed,
        batchNum: batchNum + 1,
      }));

      if (docCount < BATCH_SIZE) {
        console.log('All done!');
        break;
      }
    } catch (err) {
      console.error(`Batch ${batchNum + 1} failed:`, err.message);
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({
        lastId: lastId ? lastId.toString() : null,
        totalProcessed,
        batchNum,
        error: err.message,
      }));
      console.log('Checkpoint saved — resume by re-running');
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  console.log('\nCreating indexes...');
  await cacheColl.createIndex({ dedupKey: 1 }, { unique: true, background: true });
  await cacheColl.createIndex({ sanitized_organization_name_unanalyzed: 1 }, { background: true });
  await cacheColl.createIndex({ organization_domain: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_country: 1 }, { background: true });
  await cacheColl.createIndex({ organization_industries: 1 }, { background: true });
  await cacheColl.createIndex({ organization_num_current_employees: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_city: 1 }, { background: true });
  console.log('Indexes created.');

  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }

  const finalCount = await cacheColl.estimatedDocumentCount();
  console.log(`Done! ${finalCount} companies in cache`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

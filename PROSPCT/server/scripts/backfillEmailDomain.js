const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");

async function backfillEmailDomain() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db;
    const coll = db.collection("contacts_v5");

    // Filter: has email but no domain field yet
    const filter = {
      "_source.person_email": { $exists: true, $ne: null, $ne: "" },
      "_source.person_email_domain": { $exists: false },
    };

    // Use _id-based cursor pagination (much faster than repeated $limit queries)
    const BATCH_SIZE = 10000;
    let lastId = null;
    let processed = 0;
    const startTime = Date.now();

    while (true) {
      const cursorFilter = lastId
        ? { ...filter, _id: { $gt: lastId } }
        : filter;

      const batch = await coll
        .find(cursorFilter)
        .project({ _id: 1, _source: 1 })
        .sort({ _id: 1 })
        .limit(BATCH_SIZE)
        .toArray();

      if (batch.length === 0) {
        console.log("\nNo more documents to process. Done!");
        break;
      }

      // Extract domain from each doc and update in bulk
      const writes = [];
      for (const doc of batch) {
        const email = doc._source?.person_email;
        if (!email) continue;
        const domain = email.split("@").pop();
        if (!domain) continue;
        writes.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { "_source.person_email_domain": domain } },
          },
        });
      }

      if (writes.length > 0) {
        await coll.bulkWrite(writes, { ordered: false });
      }

      processed += batch.length;
      lastId = batch[batch.length - 1]._id;

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (processed / elapsed).toFixed(0);
      console.log(`  ${processed.toLocaleString()} · ${elapsed}s · ${rate} docs/s · last _id: ${lastId}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    console.log(`\nBackfill complete! Total updated: ${processed.toLocaleString()} in ${elapsed}s`);
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
}

backfillEmailDomain();

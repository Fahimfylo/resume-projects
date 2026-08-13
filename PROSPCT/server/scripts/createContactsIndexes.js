// One-time script to create missing compound indexes on contacts_v5.
// Run from project root: node server/scripts/createContactsIndexes.js
// Verify with: db.contacts_v5.getIndexes()

const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prospct";

async function run() {
  console.log(`Connecting to ${MONGO_URI.replace(/\/\/[^@]+@/, "//***:***@")}`);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const coll = db.collection("contacts_v5");

  const indexes = [
    {
      key: { "_source.person_location_country": 1, "_source.person_location_city": 1 },
      name: "idx_country_city",
      background: true,
    },
    {
      key: { "_source.person_location_country": 1, "_source.person_title": 1 },
      name: "idx_country_title",
      background: true,
    },
  ];

  console.log(`\nCreating ${indexes.length} indexes on contacts_v5 (61M docs — may take a while)...`);
  for (const spec of indexes) {
    try {
      console.log(`  Building index ${spec.name} ...`);
      const start = Date.now();
      await coll.createIndex(spec.key, spec);
      console.log(`  Created ${spec.name} in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    } catch (err) {
      console.error(`  Failed to create ${spec.name}: ${err.message}`);
    }
  }

  console.log("\nDone. Verify with:");
  console.log("  db.contacts_v5.getIndexes()");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

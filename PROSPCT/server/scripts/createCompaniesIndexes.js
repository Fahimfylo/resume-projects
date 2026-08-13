// One-time script to create missing indexes on companies_cache.
// Run via: node server/scripts/createCompaniesIndexes.js
// The populate script creates indexes on normalized_name + sanitized_name only.
// All other filter fields (city, state, country, zip, employees, industry,
// keywords, domain) are unindexed — this script adds them for existing data.

const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prospct";

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const coll = db.collection("companies_cache");

  const indexes = [
    { key: { organization_hq_location_city: 1 }, name: "idx_org_city", background: true },
    { key: { organization_hq_location_state: 1 }, name: "idx_org_state", background: true },
    { key: { organization_hq_location_country: 1 }, name: "idx_org_country", background: true },
    { key: { organization_hq_location_postal_code: 1 }, name: "idx_org_zip", background: true },
    { key: { organization_num_current_employees: 1 }, name: "idx_org_employees", background: true },
    { key: { organization_industries: 1 }, name: "idx_org_industries", background: true },
    { key: { organization_relevant_keywords: 1 }, name: "idx_org_keywords", background: true },
    { key: { organization_domain: 1 }, name: "idx_org_domain", background: true },
  ];

  for (const spec of indexes) {
    try {
      await coll.createIndex(spec.key, spec);
      console.log(`  Created index ${spec.name}`);
    } catch (err) {
      console.error(`  Failed to create ${spec.name}: ${err.message}`);
    }
  }

  console.log("\nDone. Verify with:");
  console.log("  db.companies_cache.getIndexes()");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

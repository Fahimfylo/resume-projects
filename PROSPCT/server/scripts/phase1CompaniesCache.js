/**
 * Phase 1 only — populate companies_cache via server-side $group + $merge.
 * Skips Phase 2 (normalize + merge) — saves hours.
 *
 * Run: node scripts/phase1CompaniesCache.js
 */
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://ProspctAdmin:Prospct.io%40007@127.0.0.1:27017/prospct?authSource=admin';

async function run() {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 0,
    heartbeatFrequencyMS: 60000,
    connectTimeoutMS: 30000,
  });

  const db = mongoose.connection.db;
  const contactsColl = db.collection('contacts_v5');
  const cacheColl = db.collection('companies_cache');

  const startTime = Date.now();

  // ── Phase 1: Server-side $group → $merge ───────────────────────────────
  console.log('Phase 1: Running server-side aggregation with $merge...');
  console.log('  (All processing on MongoDB — no data over network)');

  await cacheColl.drop().catch(() => {});
  console.log('  Dropped old companies_cache');

  const groupPipeline = [
    { $match: { '_source.sanitized_organization_name_unanalyzed': { $gt: '' } } },
    { $group: {
      _id: '$_source.sanitized_organization_name_unanalyzed',
      contactCount: { $sum: 1 },
      org_name:           { $first: '$_source.organization_name' },
      domain:             { $first: '$_source.organization_domain' },
      country:            { $first: '$_source.organization_hq_location_country' },
      city:               { $first: '$_source.organization_hq_location_city' },
      state:              { $first: '$_source.organization_hq_location_state' },
      zip:                { $first: { $ifNull: ['$_source.organization_hq_location_postal_code', '$_source.zipPostal'] } },
      industries:         { $first: '$_source.organization_industries' },
      employees:          { $first: '$_source.organization_num_current_employees' },
      founded:            { $first: '$_source.organization_founded_year' },
      linkedin:           { $first: '$_source.organization_linkedin_url' },
      website:            { $first: '$_source.organization_website_url' },
      revenue:            { $first: '$_source.organization_revenue_in_thousands_int' },
      keywords:           { $first: '$_source.organization_relevant_keywords' },
      facebook:           { $first: '$_source.organization_facebook_url' },
      twitter:            { $first: '$_source.organization_twitter_url' },
    }},
    { $project: {
      _id: 0,
      sanitized_organization_name_unanalyzed: '$_id',
      organization_name:           '$org_name',
      organization_domain:         '$domain',
      organization_hq_location_country:  '$country',
      organization_hq_location_city:     '$city',
      organization_hq_location_state:    '$state',
      organization_hq_location_postal_code: '$zip',
      organization_industries:     '$industries',
      organization_num_current_employees: '$employees',
      organization_founded_year:   '$founded',
      organization_linkedin_url:   '$linkedin',
      organization_website_url:    '$website',
      organization_revenue_in_thousands_int: '$revenue',
      organization_relevant_keywords: '$keywords',
      organization_facebook_url: '$facebook',
      organization_twitter_url: '$twitter',
      _contactCount: '$contactCount',
    }},
    { $merge: { into: 'companies_cache', whenMatched: 'replace', whenNotMatched: 'insert' } },
  ];

  try {
    await contactsColl.aggregate(groupPipeline, { allowDiskUse: true }).toArray();
  } catch (err) {
    console.error(`Phase 1 error: ${err.message}`);
    console.error('The aggregation may have partially completed.');
    throw err;
  }

  const phase1Count = await cacheColl.countDocuments();
  const phase1Time = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Phase 1 complete: ${phase1Count} raw-unique companies in ${phase1Time}s`);

  // ── Create indexes ──────────────────────────────────────────────────────
  // normalized_name is non-unique since we skip Phase 2 dedup
  await cacheColl.createIndex({ normalized_name: 1 }, { background: true }).catch(() => {});
  await cacheColl.createIndex({ sanitized_organization_name_unanalyzed: 1 }, { background: true }).catch(() => {});
  // Additional indexes for company search filters
  await cacheColl.createIndex({ organization_hq_location_country: 1 }, { background: true }).catch(() => {});
  await cacheColl.createIndex({ organization_industries: 1 }, { background: true }).catch(() => {});
  console.log('  Indexes created');

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${phase1Count} raw-unique companies in ${totalTime}s`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

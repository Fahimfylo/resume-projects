/**
 * Populate companies_cache using server-side aggregation with $merge.
 *
 * Phase 1: MongoDB $group aggregation writes raw-unique companies directly
 *          into companies_cache via $merge (fast, no data over SSH).
 * Phase 2: Normalize names and merge duplicates in the resulting cache
 *          (only ~11M docs instead of 56M).
 *
 * Run: node scripts/populateCompaniesCache.js
 */
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGO_URI = 'mongodb://ProspctAdmin:Prospct.io%40007@127.0.0.1:27017/prospct?authSource=admin';

// ── Legal suffixes (same as before) ──────────────────────────────────────
const LEGAL_SUFFIXES = [
  /\s*,?\s*inc\.?\s*$/i, /\s*,?\s*llc\.?\s*$/i, /\s*,?\s*ltd\.?\s*$/i,
  /\s*,?\s*limited\s*$/i, /\s*,?\s*corp\.?\s*$/i, /\s*,?\s*corporation\s*$/i,
  /\s*,?\s*co\.?\s*$/i, /\s*,?\s*company\s*$/i, /\s*,?\s*plc\.?\s*$/i,
  /\s*,?\s*gmbh\s*$/i, /\s*,?\s*lp\.?\s*$/i, /\s*,?\s*llp\.?\s*$/i,
  /\s*,?\s*llc\s*$/i, /\s*,?\s*inc\s*$/i, /\s*,?\s*ltd\s*$/i,
  /\s*,?\s*corp\s*$/i, /\s*,?\s*co\s*$/i,
];

function normalizeCompanyName(name) {
  if (!name || typeof name !== 'string') return null;
  let s = name.trim();
  if (s === '' || s.toLowerCase() === '[missing]') return null;
  s = s.toLowerCase();
  for (const re of LEGAL_SUFFIXES) s = s.replace(re, '');
  s = s.replace(/[.,;:'"()]/g, '').replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
  return s.length > 0 ? s : null;
}

// ── Main ─────────────────────────────────────────────────────────────────
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

  // ── Phase 1: Server-side $group → $merge (NO data transferred) ──────
  console.log('Phase 1: Running server-side aggregation with $merge...');
  console.log('  (All processing on MongoDB — no data over SSH tunnel)');

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
    console.error(`  Phase 1 error: ${err.message}`);
    console.error('  The aggregation may have partially completed.');
    console.error('  Check companies_cache for partial results.');
    throw err;
  }

  const phase1Count = await cacheColl.countDocuments();
  const phase1Time = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Phase 1 complete: ${phase1Count} raw-unique companies in ${phase1Time}s`);

  // ── Phase 1b: Create indexes ─────────────────────────────────────────
  // (unique index deferred until Phase 2 completes)
  await cacheColl.createIndex({ normalized_name: 1 }, { background: true });
  await cacheColl.createIndex({ sanitized_organization_name_unanalyzed: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_city: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_state: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_country: 1 }, { background: true });
  await cacheColl.createIndex({ organization_hq_location_postal_code: 1 }, { background: true });
  await cacheColl.createIndex({ organization_num_current_employees: 1 }, { background: true });
  await cacheColl.createIndex({ organization_industries: 1 }, { background: true });
  await cacheColl.createIndex({ organization_relevant_keywords: 1 }, { background: true });
  await cacheColl.createIndex({ organization_domain: 1 }, { background: true });
  console.log('  Indexes created');

  // ── Phase 2: Normalize names and merge duplicates ────────────────────
  console.log('\nPhase 2: Normalizing company names and merging duplicates...');

  // Strategy: iterate sorted by sanitized_organization_name_unanalyzed so that
  // similar names (e.g. "acme corp" and "acme corporation") are adjacent.
  // Group consecutive docs that normalize to the same key, upsert once per group.
  // This guarantees each normalized_name is processed exactly once with all
  // its constituent raw names merged.

  let phase2Total = 0;
  let currentNormalized = null;
  let currentGroup = null;
  let knownAliases = [];
  const BATCH_SIZE = 10000;
  const bulkBuffer = [];

  async function flushGroup() {
    if (!currentNormalized || !currentGroup) return;
    const doc = {
      normalized_name: currentNormalized,
      sanitized_organization_name_unanalyzed: currentGroup.sanitized_organization_name_unanalyzed,
      organization_name: currentGroup.organization_name,
      organization_domain: currentGroup.organization_domain,
      organization_hq_location_country: currentGroup.organization_hq_location_country,
      organization_hq_location_city: currentGroup.organization_hq_location_city,
      organization_hq_location_state: currentGroup.organization_hq_location_state,
      organization_hq_location_postal_code: currentGroup.organization_hq_location_postal_code,
      organization_industries: currentGroup.organization_industries,
      organization_num_current_employees: currentGroup.organization_num_current_employees,
      organization_founded_year: currentGroup.organization_founded_year,
      organization_linkedin_url: currentGroup.organization_linkedin_url,
      organization_website_url: currentGroup.organization_website_url,
      organization_revenue_in_thousands_int: currentGroup.organization_revenue_in_thousands_int,
      organization_relevant_keywords: currentGroup.organization_relevant_keywords,
      organization_facebook_url: currentGroup.organization_facebook_url,
      organization_twitter_url: currentGroup.organization_twitter_url,
      _contactCount: currentGroup._contactCount,
    };
    if (knownAliases.length > 0) doc.aliases = knownAliases;

    bulkBuffer.push({
      updateOne: {
        filter: { normalized_name: currentNormalized },
        update: { $set: doc },
        upsert: true,
      }
    });
  }

  async function flushBatch() {
    if (bulkBuffer.length === 0) return;
    let retries = 2;
    while (retries > 0) {
      try {
        await cacheColl.bulkWrite(bulkBuffer, { ordered: false });
        break;
      } catch (err) {
        retries--;
        if (retries > 0) {
          console.error(`    BulkWrite error, retrying: ${err.message}`);
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
    bulkBuffer.length = 0;
  }

  const cursor2 = cacheColl.find(
    {},
    {
      projection: {
        sanitized_organization_name_unanalyzed: 1,
        organization_name: 1,
        organization_domain: 1,
        organization_hq_location_country: 1,
        organization_hq_location_city: 1,
        organization_hq_location_state: 1,
        organization_hq_location_postal_code: 1,
        organization_industries: 1,
        organization_num_current_employees: 1,
        organization_founded_year: 1,
        organization_linkedin_url: 1,
        organization_website_url: 1,
        organization_revenue_in_thousands_int: 1,
        organization_relevant_keywords: 1,
        organization_facebook_url: 1,
        organization_twitter_url: 1,
        _contactCount: 1,
      },
      batchSize: 10000,
      noCursorTimeout: true,
    }
  ).sort({ sanitized_organization_name_unanalyzed: 1 });

  while (await cursor2.hasNext()) {
    const doc = await cursor2.next();
    phase2Total++;

    const rawName = doc.sanitized_organization_name_unanalyzed;
    if (!rawName) continue;

    const normalized = normalizeCompanyName(rawName);
    if (!normalized) continue;

    if (normalized !== currentNormalized) {
      // Flush previous group
      if (currentNormalized && currentGroup) {
        await flushGroup();
        if (bulkBuffer.length >= BATCH_SIZE) {
          await flushBatch();
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`  Normalized ${phase2Total}/${phase1Count} raw groups — ${elapsed}s`);
        }
      }

      // Start new group
      currentNormalized = normalized;
      currentGroup = {
        sanitized_organization_name_unanalyzed: rawName,
        organization_name: doc.organization_name || null,
        organization_domain: doc.organization_domain || null,
        organization_hq_location_country: doc.organization_hq_location_country || null,
        organization_hq_location_city: doc.organization_hq_location_city || null,
        organization_hq_location_state: doc.organization_hq_location_state || null,
        organization_hq_location_postal_code: doc.organization_hq_location_postal_code || null,
        organization_industries: doc.organization_industries || null,
        organization_num_current_employees: doc.organization_num_current_employees || null,
        organization_founded_year: doc.organization_founded_year || null,
        organization_linkedin_url: doc.organization_linkedin_url || null,
        organization_website_url: doc.organization_website_url || null,
        organization_revenue_in_thousands_int: doc.organization_revenue_in_thousands_int || null,
        organization_relevant_keywords: doc.organization_relevant_keywords || null,
        organization_facebook_url: doc.organization_facebook_url || null,
        organization_twitter_url: doc.organization_twitter_url || null,
        _contactCount: doc._contactCount || 1,
      };
      knownAliases = normalized !== rawName.toLowerCase().trim() ? [rawName] : [];
    } else {
      // Same normalized name — merge data
      currentGroup._contactCount += doc._contactCount || 1;
      if (rawName !== knownAliases[knownAliases.length - 1]) {
        knownAliases.push(rawName);
      }
      if (!currentGroup.organization_domain && doc.organization_domain) currentGroup.organization_domain = doc.organization_domain;
      if (!currentGroup.organization_hq_location_country && doc.organization_hq_location_country) currentGroup.organization_hq_location_country = doc.organization_hq_location_country;
      if (!currentGroup.organization_hq_location_city && doc.organization_hq_location_city) currentGroup.organization_hq_location_city = doc.organization_hq_location_city;
      if (!currentGroup.organization_hq_location_state && doc.organization_hq_location_state) currentGroup.organization_hq_location_state = doc.organization_hq_location_state;
      if (!currentGroup.organization_hq_location_postal_code && doc.organization_hq_location_postal_code) currentGroup.organization_hq_location_postal_code = doc.organization_hq_location_postal_code;
      if (!currentGroup.organization_industries && doc.organization_industries) currentGroup.organization_industries = doc.organization_industries;
      if (!currentGroup.organization_num_current_employees && doc.organization_num_current_employees) currentGroup.organization_num_current_employees = doc.organization_num_current_employees;
      if (!currentGroup.organization_founded_year && doc.organization_founded_year) currentGroup.organization_founded_year = doc.organization_founded_year;
      if (!currentGroup.organization_linkedin_url && doc.organization_linkedin_url) currentGroup.organization_linkedin_url = doc.organization_linkedin_url;
      if (!currentGroup.organization_website_url && doc.organization_website_url) currentGroup.organization_website_url = doc.organization_website_url;
      if (!currentGroup.organization_revenue_in_thousands_int && doc.organization_revenue_in_thousands_int) currentGroup.organization_revenue_in_thousands_int = doc.organization_revenue_in_thousands_int;
      if (!currentGroup.organization_relevant_keywords && doc.organization_relevant_keywords) currentGroup.organization_relevant_keywords = doc.organization_relevant_keywords;
      if (!currentGroup.organization_facebook_url && doc.organization_facebook_url) currentGroup.organization_facebook_url = doc.organization_facebook_url;
      if (!currentGroup.organization_twitter_url && doc.organization_twitter_url) currentGroup.organization_twitter_url = doc.organization_twitter_url;
    }
  }

  // Flush last group + batch
  if (currentNormalized && currentGroup) {
    await flushGroup();
  }
  await flushBatch();

  // Clean up: remove all docs without normalized_name (the old raw Phase 1 docs)
  const deleteResult = await cacheColl.deleteMany({ normalized_name: { $exists: false } });
  if (deleteResult.deletedCount > 0) {
    console.log(`  Cleaned up ${deleteResult.deletedCount} un-normalized docs`);
  }

  // Drop and recreate normalized_name as unique
  await cacheColl.dropIndex({ normalized_name: 1 }).catch(() => {});
  await cacheColl.createIndex({ normalized_name: 1 }, { unique: true, background: true });

  const finalCount = await cacheColl.countDocuments();
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone! ${finalCount} normalized unique companies`);
  console.log(`Phase 1 (server-side group): ${phase1Count} raw groups`);
  console.log(`Phase 2 (normalize + merge):  ${finalCount} final companies`);
  console.log(`Reduction: ${((1 - finalCount / phase1Count) * 100).toFixed(1)}%`);
  console.log(`Total time: ${totalTime}s`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

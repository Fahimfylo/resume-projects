# Companies Data Pipeline — 2026-07-05

## Data Flow

```
contacts_v5 (61,400,700 contacts)
    │
    ▼  (aggregation pipeline: $group by company name/domain/ID)
    │
companies_cache (9,331,159 deduplicated companies)
    │
    ▼  (user bookmarks)
savedcompanies (53 records in dev)
```

---

## Source: `contacts_v5` → `companies_cache`

The `companies_cache` is populated by ETL scripts under `server/scripts/`.
Each company doc aggregates data from all contacts matching that company.

### ETL Scripts

| Script | Dedup Method | Key Index Created |
|--------|-------------|------------------|
| `phase1CompaniesCache.js` | By `sanitized_organization_name_unanalyzed` | Basic single-field indexes |
| `populateCompaniesCache.js` | Two-phase: raw group + normalize/merge names | `normalized_name` (unique), `idx_org_name`, creates `aliases` field |
| `populateCompaniesCacheAgg.js` | `dedupKey` (id > domain > name), chunked 1M | `dedupKey_1` (unique), `quality_score_-1__contactCount_-1` |
| `populateCompaniesCacheBatch.js` | Same dedupKey, cursor-based batch 500K | `dedupKey_1` (unique) |
| `backfillCompanySocialLinks.js` | `$lookup` to fill `facebook_url` + `twitter_url` | — |
| `createCompaniesIndexes.js` | Creates missing single-field indexes | Named indexes `idx_org_*` |

### Company Document Fields

| Field | Source in contacts_v5 |
|-------|----------------------|
| `sanitized_organization_name_unanalyzed` | `_source.sanitized_organization_name_unanalyzed` |
| `organization_name` | `_source.organization_name` |
| `organization_domain` | `_source.organization_domain` |
| `organization_hq_location_country` | `_source.organization_hq_location_country` |
| `organization_hq_location_city` | `_source.organization_hq_location_city` |
| `organization_hq_location_state` | `_source.organization_hq_location_state` |
| `organization_hq_location_postal_code` | `_source.organization_hq_location_postal_code` |
| `organization_industries` | `_source.organization_industries` |
| `organization_num_current_employees` | `_source.organization_num_current_employees` |
| `organization_founded_year` | `_source.organization_founded_year` |
| `organization_linkedin_url` | `_source.organization_linkedin_url` |
| `organization_website_url` | `_source.organization_website_url` |
| `organization_revenue_in_thousands_int` | `_source.organization_revenue_in_thousands_int` |
| `organization_relevant_keywords` | `_source.organization_relevant_keywords` |
| `organization_facebook_url` | `_source.organization_facebook_url` |
| `organization_twitter_url` | `_source.organization_twitter_url` |
| `_contactCount` | `$sum: 1` (count of contacts per company) |
| `normalized_name` | Derived by stripping legal suffixes (Inc, LLC, Corp, etc.) |
| `dedupKey` | Computed as `"id:<orgId>"`, `"domain:<domain>"`, or `"name:<name>"` |
| `organization_id` | `_source.organization_id` |
| `quality_score` | Unknown external source (populated outside scripts) |

---

## Indexes on `companies_cache` (21 total)

### Compound indexes for company search (used by `getCompanyFilterIndex`)

These are preferred by the hint system when querying with `quality_score` + a filter field:

| Index | Key Pattern |
|-------|------------|
| `quality_score_-1_organization_hq_location_country_1` | `{ quality_score: -1, organization_hq_location_country: 1 }` |
| `quality_score_-1_organization_industries_1` | `{ quality_score: -1, organization_industries: 1 }` |
| `quality_score_-1_organization_num_current_employees_1` | `{ quality_score: -1, organization_num_current_employees: 1 }` |
| `quality_score_-1_organization_hq_location_city_1` | `{ quality_score: -1, organization_hq_location_city: 1 }` |
| `quality_score_-1_organization_hq_location_state_1` | `{ quality_score: -1, organization_hq_location_state: 1 }` |
| `quality_score_-1_organization_hq_location_postal_code_1` | `{ quality_score: -1, organization_hq_location_postal_code: 1 }` |
| `quality_score_-1_organization_relevant_keywords_1` | `{ quality_score: -1, organization_relevant_keywords: 1 }` |
| `quality_score_-1__contactCount_-1` | `{ quality_score: -1, _contactCount: -1 }` (fallback) |

### Single-field indexes (for partial/scalar matches)

| Index | Key Pattern |
|-------|------------|
| `sanitized_organization_name_unanalyzed_1` | `{ sanitized_organization_name_unanalyzed: 1 }` |
| `organization_domain_1` | `{ organization_domain: 1 }` |
| `organization_hq_location_country_1` | `{ organization_hq_location_country: 1 }` |
| `organization_industries_1` | `{ organization_industries: 1 }` |
| `organization_num_current_employees_1` | `{ organization_num_current_employees: 1 }` |
| `organization_hq_location_city_1` | `{ organization_hq_location_city: 1 }` |
| `organization_hq_location_state_1` | `{ organization_hq_location_state: 1 }` |
| `organization_hq_location_postal_code_1` | `{ organization_hq_location_postal_code: 1 }` |
| `organization_relevant_keywords_1` | `{ organization_relevant_keywords: 1 }` |
| `idx_org_name` | `{ organization_name: 1 }` |
| `idx_normalized_name` | `{ normalized_name: 1 }` |

### Unique constraint

| Index | Key Pattern | Purpose |
|-------|------------|---------|
| `dedupKey_1` | `{ dedupKey: 1 }` (unique) | Prevents duplicate companies |

### Default

| Index | Key Pattern | Purpose |
|-------|------------|---------|
| `_id_` | `{ _id: 1 }` | Primary key |

---

## How Companies Are Searched

In `server/services/searchService.js`, `executeCompanySearch`:

1. **Cache check** — Redis key `"company:<cacheKey>"` (TTL 300s)
2. **Saved IDs hydration** — Loads user's saved company IDs from `SavedItem` + `SavedContacts`
3. **Build MongoDB query** (lines 1328-1451) — `$and` conditions:
   - `quality_score { $gte: 60 }` (default threshold)
   - `organizationName` → prefix range on `normalized_name` AND `sanitized_organization_name_unanalyzed`
   - `organizationDomain` → prefix range on `organization_domain`
   - `country` → `$in` on `organization_hq_location_country`
   - `cityState`/`location` → prefix range on city OR state
   - `zip` → prefix range on `organization_hq_location_postal_code`
   - `industry` → `$in` (lowercased) on `organization_industries`
   - `employeeRange` → `$gte`/`$lte` on `organization_num_current_employees`
   - `keywords` → prefix range on `organization_relevant_keywords`
4. **Index hint** via `getCompanyFilterIndex()` (line 567-643):
   - Prefers compound `quality_score + filter_field` indexes
   - Falls back to single-field hints
   - Returns `{ _id: 1 }` if no filters, `null` (no hint) for non-selective ops
5. **Two-stage fetch**:
   - Stage 1: `find().hint().skip().limit().allowDiskUse().maxTimeMS(120000)` — fetches `_id` only
   - Stage 2: hydrates full docs by `_id`
6. **Format** — wraps as `{ _id, _source: doc, is_saved, _contactCount }`

---

## Count Discrepancy

| Source | Count |
|--------|-------|
| `companies_cache` on this dev DB | **9,331,159** |
| User mentioned | **2,353,968** |

The 2.35M figure likely came from an older script run (e.g., Phase 1 only of `populateCompaniesCache.js`, or `phase1CompaniesCache.js` without dedupKey normalization). The current `dedupKey`-based aggregation produces a different (higher) count, possibly including more edge cases or from a different snapshot of `contacts_v5`.

---

## Other Collections Involved

| Collection | Role |
|------------|------|
| **`contacts_v5`** | Source of truth — 61M+ contacts, each with `_source.organization_*` fields |
| **`companies_cache`** | Company-level cache — deduplicated, indexed for search |
| **`savedcompanies`** | User-saved companies (bookmarks) — 53 records in dev |
| **`saveditems`** | User-saved contacts — helps mark `is_saved` on results |
| **`savedcontacts`** | User-saved contacts (alternate) — same purpose |
| **Elasticsearch `contacts_search`** | Legacy aggregate-based company dedup (via `companyDeduplicationService`) |
| **`lists`** | User-defined lists — can reference companies via `SavedCompanies.listIds` |

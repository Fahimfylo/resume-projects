# Search System Architecture

## 1. Overview

The search system queries a single MongoDB collection (`contacts_v5`, ~61M documents) with **no Elasticsearch**. All search, filtering, counting, and pagination is handled by MongoDB queries with Redis caching on top.

### Data Model

**Collection:** `contacts_v5` (Mongoose model at `server/models/Contacts.js`)

Each document mirrors the original Elasticsearch shape:
```
{
  _id: String,            // Elasticsearch document ID
  _index: String,
  _type: String,
  _score: Number,
  _source: {              // Actual contact data (snake_case fields)
    person_email, person_first_name, person_last_name,
    person_title, person_seniority, person_location_country,
    person_location_city, person_location_state, person_location_postal_code,
    organization_name, organization_domain, organization_industries,
    organization_num_current_employees, organization_founded_year,
    person_email_status_cd, person_email_domain,
    organization_keywords, organization_current_technologies,
    ...
  }
}
```

### Service Layer (`server/services/searchService.js` ~1694 lines)

Three exported search functions:

| Function | Purpose | Cache TTL | Timeout |
|----------|---------|-----------|---------|
| `executeSearch()` | Full search with pagination (batch or page mode) | 120s | 5-30s |
| `executeSearchCount()` | Aggregated count (total, saved, new) | 600s | 3s |
| `executeCompanySearch()` | Unique company search via CompaniesCache | 300s | 120s |

---

## 2. How Searches Work

### 2.1 Client Orchestration (`LeadRightSec.jsx`)

Whenever `resultsFilterKey` changes (debounced filters, `dataRefreshKey`, or retry key), the client runs a two-phase fetch:

**Phase 1 — Batch Fetch (immediate):**
1. POST `/api/search/batch` with `{ filters, excludedFilters }`
2. Server returns first set of rows + `nextCursor`
3. Table renders immediately
4. Auto-loads up to 4 more batch pages in background (total ~100 rows)

**Phase 2 — Count Fetch (background with retry):**
1. POST `/api/search/count` with same filters
2. Server may return `null` if count is being computed in background
3. Client retries up to 7 times at 5-second intervals (35s total)
4. On success, updates counts displayed in the topbar

### 2.2 Server-Side Batch Search (`executeSearch(batchMode=true)`)

1. **Resolve saved contact IDs** — checks `savedIds:<userId>` Redis cache (300s TTL), falls back to MongoDB
2. **Resolve list contact IDs** — queries `List` + `SavedContacts` if `filters.list` is set
3. **Build MongoDB query** via `buildMongoQuery(filters, viewType, savedIds, listIds, excludedFilters)`
4. **Stage 1** — Fetch only `_id` fields with `maxTimeMS: 5000` (5s), using index hint if available. No sort — relies on natural `_id` order from index walk. If timeout, retry without hint at 60s.
5. **Stage 2** — Fetch `_source` for exactly the returned IDs
6. **Tag each result** with `is_saved: true/false` based on savedContactIds Set
7. **Background enrichment** — via `setImmediate`, looks up company data to fill missing fields
8. **Background filter cache** — if `FILTER_CACHE_ENABLED`, saves ID sets to Redis for progressive filter narrowing

### 2.3 Server-Side Count (`executeSearchCount`)

1. **Check Redis cache** — `count:search:v7:<userId>:<filters>:<excluded>` (600s TTL)
2. **Check pending flag** — `count:pending:<cacheKey>` — if another request is already computing, return `null`
3. **No-filter fast path** — uses `estimatedDocumentCount()` (instant) + saved count
4. **Build queries** — `totalQuery` (all matching docs) and `savedQuery` (matching + saved)
5. **Run parallel counts** — `countDocuments()` with `maxTimeMS: 3000` (3s), using index hint
6. **Timeout handling**: if either count times out, spawn background `setImmediate` to re-run without timeout. Set pending flag (120s auto-expire). Return partial results if available.
7. **Derive `new` count** = `Math.max(0, total - saved)`
8. **Cache** result in Redis with 600s TTL

### 2.4 Cursor-Based Pagination

- First batch returns `nextCursor` (MongoDB `_id` of the last document)
- Subsequent calls to `/api/search/batch/next` pass the cursor
- Query: `{ _id: { $gt: cursor } }` combined with original filters
- Relies on `_id` natural order from the index used

---

## 3. Query Building (`server/utils/searchQueryBuilder.js` + `searchService.js`)

### 3.1 Filter Type Mappings

The `fieldConfig` registry maps client filter keys to MongoDB query strategies:

| Type | MongoDB Operator | Example |
|------|-----------------|---------|
| `keyword` | `$in` / `$nin` | `country`, `industry`, `seniority`, `emailStatus` |
| `wildcard` | `$gte/$lt` (prefix) or `$regex` | `city`, `jobTitle`, `organizationName` |
| `range` | `$or` of range conditions | `employeeRange`, `revenueRange` |
| `match_phrase_prefix` | `$gte/$lt` split by words | `personName` (full_name) |
| `location_search` | `$or` of `$gte/$lt` on city+state | `location`, `cityState` |
| `exists` | `$exists: true, $ne: null` | `hasCompany` |
| `domain_match` | `$or` over domain + website fields | `emailType` |

### 3.2 Field Translation

ES-era field names are translated to MongoDB paths via `toMongoPath(esField)`:
- `company_country` → `_source.person_location_country`
- `email_status` → `_source.person_email_status_cd`
- `employee_count` → `_source.organization_num_current_employees`
- etc.

### 3.3 Exclusion Filters

Every filter type also supports an exclusion variant (negation):
- `keyword` excluded → `$nin` instead of `$in`
- `wildcard` excluded → `$not` + `$regex` or `$not` + `$gte/$lt`
- `range` excluded → `$nor` of range conditions

---

## 4. Indexing Strategy (`server/models/Contacts.js`)

### 4.1 Current Indexes

All created with `{ background: true }`:

**Single-field indexes (keyword / exact match):**
| Index | Used For |
|-------|----------|
| `_source.person_email_status_cd` | Email status filter |
| `_source.organization_industries` | Industry filter |
| `_source.person_seniority` | Seniority filter |
| `_source.person_location_country` | Country filter |
| `_source.person_email_domain` | Email domain filter |
| `_source.job_functions.name` | Job function filter |
| `_source.organization_domain` | Domain search |

**Single-field indexes (wildcard / prefix):**
| Index | Used For |
|-------|----------|
| `_source.organization_name` | Company name search |
| `_source.person_email` | Email search |
| `_source.person_location_city` | City filter |
| `_source.person_title` | Job title filter |
| `_source.person_location_postal_code` | Zip code filter |
| `_source.organization_keywords` | Keywords filter |

**Single-field indexes (range):**
| Index | Used For |
|-------|----------|
| `_source.organization_num_current_employees` | Employee range filter |
| `_source.organization_founded_year` | Founded year filter |

**Compound indexes:**
| Index | Purpose |
|-------|---------|
| `city + state + country` | Location multi-filter |
| `country + seniority + email_status` | Common multi-filter combo |
| `industries + country` | Industry + country combo |
| `country + city` | Country + city combo |
| `country + title` | Country + job title combo |

### 4.2 Index Hint Optimizer (`getFilterIndex()`)

The hint optimizer selects the best index for a given query, using this priority:

1. **Skip if `$or` with >1 element** (hints break `$or`)
2. **Skip if `_id: $in`** (PK is more selective)
3. **Skip if `$exists/$ne/$nin/$not`** (indexes don't help non-selective operators)
4. **Try compound indexes** (most specific first):
   - `country+seniority+email_status` (3-field)
   - `industry+country` (2-field)
   - `city+state+country` (3-field)
   - `country+city` (2-field)
   - `country+title` (2-field)
5. **Fall back to single field** — picks most selective by this ordering:
   ```
   postal_code → city → domain → email → org_name → email_domain
   → employees → industries → keywords → founded_year → technologies
   → title → seniority → country → email_status
   ```

---

## 5. Redis Caching Layer

### 5.1 Cache Keys and TTLs

| Cache | Key Pattern | TTL | Invalidation |
|-------|-------------|-----|--------------|
| Search Results | `search:v7:<userId>:<filters>:<excluded>` | 120s | On save/delete via `savedController` |
| Search Count | `count:search:v7:<userId>:<filters>:<excluded>` | 600s | On save/delete via `savedController` |
| Saved IDs | `savedIds:<userId>` | 300s | On save/delete via `savedController` |
| Pending Count | `count:pending:count:search:v7:*` | 120s | Auto-expire |
| Total Count (no filter) | `count:total:nofilter` | 3600s | Never (auto-expire) |
| Company Search | `company:search:v7:<userId>:*` | 300s | On company save |
| Suggestions | `suggest:<type>:<query>` | 60s | Never (auto-expire) |
| Filter ID Sets | `idset:v1:<hash>` | 180s | Never (auto-expire) |

### 5.2 Cache Invalidation (`savedController.js`)

When items are saved or deleted (both batch and individual paths):

```javascript
// Pattern-based KEYS delete
const searchKeys = await redisClient.keys(`search:v7:${userId}:*`);
if (searchKeys?.length > 0) await redisClient.del(searchKeys);

const countKeys = await redisClient.keys(`count:search:v7:${userId}:*`);
if (countKeys?.length > 0) await redisClient.del(countKeys);

await redisClient.del(`savedIds:${userId}`);
```

This clears ALL search and count caches for the user, forcing fresh queries on next request.

### 5.3 Redis Connection (`server/redisClient.js`)

- Uses `redis` npm package `createClient()`
- Configured via `REDIS_PASSWORD`, `REDIS_HOST`, `REDIS_PORT` env vars
- Non-blocking — server starts even if Redis is down
- Retry with backoff (100ms → 10s max), gives up after 5 attempts, resets cooldown after 60s
- All operations wrapped in a safe proxy: `get` returns `null`, `set`/`del` no-ops, `keys` returns `[]` on failure

---

## 6. Performance Characteristics

### 6.1 Current Bottlenecks

1. **No covering indexes** — All queries need to fetch the full `_source` document from disk (stage 2), even after finding matching IDs (stage 1). The two-stage approach reduces this but doesn't eliminate it.

2. **`_source` is a Mixed type** — MongoDB can't optimize storage or queries within it. Every query must navigate the full document.

3. **Single-field indexes for multi-filter queries** — When 7-8 filters are combined, only ONE index can be used (the hint optimizer picks the most selective). All other filters are applied as residual in-memory filtering, which is slow on 61M documents.

4. **No compound index for common 7-8 filter combos** — The current compounds only cover 2-3 fields. When users combine `country + industry + seniority + emailStatus + employeeRange + city + title`, the query must scan millions of documents on the single best index and filter the rest in memory.

5. **`_source.*` dotted paths** — MongoDB has limitations on indexed field sizes and performance for deeply nested paths.

6. **Redis `KEYS` on invalidation** — While functional, `KEYS` is O(N) and blocks Redis. On large Redis instances with many keys, this can be slow.

7. **3-second count timeout** — The count endpoint uses `maxTimeMS: 3000`, which frequently times out on complex multi-filter queries, triggering a background recount. This means the user sees "loading" for up to 35s (7 retries × 5s).

### 6.2 Memory Requirements

- **MongoDB:** The `contacts_v5` collection at 61M documents with full `_source` documents is estimated at 200-500GB (each `_source` document is typically 2-8KB). The working set (indexes + frequently accessed documents) should fit in RAM for good performance. Each index adds ~2-5GB.
- **Redis:** Each cached search result is ~0.5-2MB. With 1000 active users each having 10 cached searches, that's ~5-10GB. Filter ID sets can also consume significant memory.
- **Application server:** Memory is primarily for Node.js heap (typically 1-4GB budget).

---

## 7. Strategies to Speed Up Combined 7-8 Filters

### 7.1 Approach A: Add Targeted Compound Indexes (Lowest Effort)

Create compound indexes covering the most common filter combinations. Based on usage patterns:

```javascript
// Country + Industry + Seniority + Email Status (4-field)
contactsV5Schema.index(
  { "_source.person_location_country": 1, "_source.organization_industries": 1,
    "_source.person_seniority": 1, "_source.person_email_status_cd": 1 },
  { background: true }
);

// City + Title + Seniority (3-field)
contactsV5Schema.index(
  { "_source.person_location_city": 1, "_source.person_title": 1,
    "_source.person_seniority": 1 },
  { background: true }
);

// Employee Range + Revenue Range + Country (2-field + country)
contactsV5Schema.index(
  { "_source.organization_num_current_employees": 1,
    "_source.person_location_country": 1 },
  { background: true }
);
```

**Benefits:** Immediate query speedup for matching combos with zero code changes.
**Costs:** Each compound index adds ~2-5GB and slows writes slightly.
**Limitation:** Need to predict which combinations users will actually use. An index on `A+B+C` doesn't help `A+C` or `B+C` queries.

### 7.2 Approach B: Flatten Key Fields to Top Level (Medium Effort)

Copy commonly-filtered fields to the document root so MongoDB can use them without the `_source.` prefix penalty:

```javascript
// In schema:
{
  _id: String,
  _source: Mixed,
  // Flattened indexed fields (kept in sync on write/import)
  person_location_country: String,
  organization_industries: [String],
  person_seniority: String,
  person_email_status_cd: String,
  person_title: String,
  person_location_city: String,
  organization_num_current_employees: Number,
  organization_founded_year: Number,
}
```

**Benefits:** Shorter index keys, better selectivity estimation, no nested path overhead.
**Costs:** Requires data migration or dual-write strategy. Increases document size slightly.
**Limitation:** Only helps if we also add compound indexes on these flattened fields.

### 7.3 Approach C: Increase Count Timeout (Very Low Effort)

Raise `maxTimeMS` in `executeSearchCount` from 3000ms to 10000-15000ms:

```javascript
const COUNT_TIMEOUT_MS = 15000; // instead of 3000
```

**Benefits:** One-line change. Fewer timeouts → fewer background recomputes → faster user-facing counts.
**Costs:** Slower responses for complex queries (user waits longer for first response).
**Limitation:** Doesn't fix slow queries; just reduces retries.

### 7.4 Approach D: Pre-computed Count Materialization (High Effort)

Run a periodic job that pre-computes counts for common filter combinations and stores them in a separate collection or Redis. The count endpoint reads from this materialized view instead of running `countDocuments`.

```javascript
// Materialized counts collection
{
  hash: "abc123...",  // SHA1 of filter combination
  filters: { country: "US", industry: "Software", ... },
  total: 45231,
  saved: 1234,
  new: 43997,
  updatedAt: Date
}
```

**Benefits:** Instant count responses. No query timeouts. Scales to any number of users.
**Costs:** Requires a background job infrastructure. Stale counts between refreshes. Complex to implement for all possible filter combinations.

### 7.5 Approach E: Paginated Scan + Client-Side Count (Speculative)

Instead of running `countDocuments()`, fetch all matching `_id`s via cursor/stream and count client-side. Only works for moderate result sets (< 100K).

**Benefits:** No timeout issues. Can stream and stop when enough results found.
**Costs:** Impractical for large result sets. High network overhead.

### 7.6 Approach F: Batch Count via Aggregation Pipeline (Experimental)

Use MongoDB aggregation with `$match` + `$group` + `$count` in a single pass, which can be more efficient than two separate `countDocuments` calls:

```javascript
const [result] = await contacts_v5.aggregate([
  { $match: baseQuery },
  { $group: {
      _id: null,
      total: { $sum: 1 },
      saved: { $sum: { $cond: [{ $in: ["$_id", savedContactIds] }, 1, 0] } }
  }}
]);
```

**Benefits:** Single index scan for both counts.
**Costs:** Slightly more complex. May not be faster if `savedContactIds` is small.

### 7.7 Approach G: Increase Batch Size + Server-Side Filtering

Increase the initial batch from 25 to 100-500 rows. Apply the remaining filters server-side in memory after fetching a reasonable candidate set. This avoids deep index scans for the count.

**Benefits:** Fast initial results for most queries.
**Costs:** Inaccurate counts. Pagination edge cases.

---

## 8. Recommended Action Plan (Priority Order)

### Phase 1 — Immediate (1-2 days)
1. **Increase count timeout** — Change `COUNT_TIMEOUT_MS` from 3000 to 15000. Reduces background recompute frequency.
2. **Reduce Redis TTLs** — Lower `savedIds` from 300s to 60s, count cache from 600s to 120s. Fresher data with minimal performance impact.
3. **Replace `KEYS` with `SCAN`** in cache invalidation — Safer for production Redis.

### Phase 2 — Short-term (1-2 weeks)
4. **Analyze real query patterns** — Log all filter combinations that hit the count endpoint. Identify the top 10 most common multi-filter combos.
5. **Add targeted 3-4 field compound indexes** based on real usage data. Each index costs ~2-5GB but can 10-100x speed up specific queries.
6. **Update `getFilterIndex()`** to recognize the new compound indexes and prefer them.
7. **Increase batch auto-load** from 4 to 8-10 batches (200-250 rows) — users see more data faster.

### Phase 3 — Medium-term (2-4 weeks)
8. **Flatten common fields** to top level via a migration script. Update `buildMongoQuery` and `getFilterIndex` to use root paths.
9. **Add aggregation-based count** — Replace two parallel `countDocuments` calls with a single aggregation `$group` pipeline.
10. **Evaluate materialized counts** — Build a background job for pre-computed counts if Phase 2 compounds aren't enough.

### Phase 4 — Long-term (1-2 months)
11. **Evaluate dedicated search infrastructure** — If MongoDB cannot meet performance requirements, consider:
    - **Elasticsearch** (original design intent)
    - **MongoDB Atlas Search** (managed, no new infra)
    - **ClickHouse** (for OLAP-style counting/analytics)

---

## 9. Minimal Requirements for Acceptable Performance

For queries combining 7-8 filters on 61M documents, the minimum requirements are:

**Indexes:**
- At least one 3-4 field compound index covering the most common filter combination
- Single-field indexes on all filterable fields (already have these)
- No more than 6-8 fields per compound index (diminishing returns beyond that)

**Hardware:**
- MongoDB: 64GB+ RAM (for working set of indexes + hot data)
- Redis: 8-16GB RAM (for cached results + filter ID sets)
- Application: 4+ vCPU, 8GB+ RAM

**Software:**
- MongoDB 6.0+ (for better compound index performance)
- Node.js 18+ LTS

**Without compound indexes**, 7-8 filter combos will always scan millions of documents regardless of hardware. The single best index is used and all other filters are applied in memory as residual predicates.

---

## 10. Current Architecture Diagram

```
  LeadRightSec.jsx
       │
       ├── POST /api/search/batch ──────► searchController.searchBatch
       │        │                              │
       │        │                              └► executeSearch(batchMode=true)
       │        │                                    │
       │        │                                    ├── Redis: savedIds (300s)
       │        │                                    ├── MongoDB: Stage 1 (_id, 5s)
       │        │                                    ├── MongoDB: Stage 2 (_source)
       │        │                                    └── setImmediate: enrichment
       │        │
       ├── POST /api/search/count ──────► searchController.getSearchCount
       │        │                              │
       │        │                              └► executeSearchCount()
       │        │                                    │
       │        │                                    ├── Redis: count:search:v7 (600s)
       │        │                                    ├── Redis: count:pending (120s)
       │        │                                    ├── MongoDB: countDocuments (3s × 2)
       │        │                                    └── setImmediate: background recount
       │        │
       └── Save/Delete ────────────────► savedController
                                                │
                                                └── Redis: del search:v7:{userId}:*
                                                └── Redis: del count:search:v7:{userId}:*
                                                └── Redis: del savedIds:{userId}
                                                └── Client: incrementDataRefreshKey()

  Redis Cache (shared, non-blocking):
    search:v7:{userId}:{filters}:{excluded}    120s
    count:search:v7:{userId}:{filters}:{excluded}  600s
    savedIds:{userId}                         300s
    count:pending:{cacheKey}                  120s
    count:total:nofilter                     3600s
    idset:v1:{hash}                           180s

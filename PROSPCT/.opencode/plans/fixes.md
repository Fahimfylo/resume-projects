# FIX 1 — searchService.js: Hint fallback in executeSearchCount

**File:** `server/services/searchService.js`
**Lines:** 1067-1084

Replace this block:

```js
  // Count with hint and shorter timeout (10s) — if it times out, return null
  const COUNT_TIMEOUT_MS = 10000;
  const mkCountOpts = (q) => {
    const opts = { maxTimeMS: COUNT_TIMEOUT_MS };
    const hint = getFilterIndex(q);
    if (hint) opts.hint = hint;
    return opts;
  };
  const countTotal = contacts_v5.countDocuments(totalQuery, mkCountOpts(totalQuery)).catch(err => {
    console.error("[SEARCH] COUNT total query failed:", err.message);
    return null;
  });
  const countSaved = contacts_v5.countDocuments(savedQuery, mkCountOpts(savedQuery)).catch(err => {
    console.error("[SEARCH] COUNT saved query failed:", err.message);
    return null;
  });

  const [total, saved] = await Promise.all([countTotal, countSaved]);
```

With:

```js
  // Count with hint and shorter timeout (10s) — if it times out, return null
  const COUNT_TIMEOUT_MS = 10000;
  const mkCountOpts = (q) => {
    const opts = { maxTimeMS: COUNT_TIMEOUT_MS };
    const hint = getFilterIndex(q);
    if (hint) opts.hint = hint;
    return opts;
  };
  const tryCount = async (query, opts) => {
    try {
      return await contacts_v5.countDocuments(query, opts);
    } catch (err) {
      if (err.message?.includes('bad hint') || err.message?.includes('hint')) {
        try {
          return await contacts_v5.countDocuments(query, { maxTimeMS: opts.maxTimeMS });
        } catch (e) {
          console.error('[COUNT] Retry failed:', e.message);
          return null;
        }
      }
      console.error('[COUNT] Failed:', err.message);
      return null;
    }
  };

  const [total, saved] = await Promise.all([
    tryCount(totalQuery, mkCountOpts(totalQuery)),
    tryCount(savedQuery, mkCountOpts(savedQuery))
  ]);
```

---

# FIX 2 — searchService.js: Fix null newCount crash

**File:** `server/services/searchService.js`
**Lines:** 1086-1092

Replace:

```js
  // Derive new count from total - saved
  let newCount = null;
  if (total !== null && saved !== null) {
    newCount = Math.max(0, total - saved);
  }

  const result = { total, saved, new: newCount, fromCache: false };
```

With:

```js
  // Derive new count from total - saved
  let newCount = null;
  if (total !== null && saved !== null) {
    newCount = Math.max(0, total - saved);
  } else if (total !== null) {
    newCount = total; // saved unknown, assume all new
  }

  const result = { total: total ?? null, saved: saved ?? 0, new: newCount ?? null, fromCache: false };
```

---

# FIX 3 — parseNumber.js: Add safety guards

**File:** `server/utils/parseNumber.js`
**Lines:** 1-24

Replace the entire file with:

```js
const suffixMultipliers = {
  K: 1000,
  M: 1000000,
  B: 1000000000,
};

const parseNumber = (value) => {
  try {
    if (value === null || value === undefined) return NaN;
    if (typeof value === 'number') return value;

    const str = String(value).trim();
    if (str.length === 0 || str.length > 50) return NaN;

    // strip null bytes
    const clean = str.replace(/\0/g, '').toUpperCase();

    // Match number with optional suffix
    const match = clean.match(/^([\d.]+)([KMB]?)$/);
    if (!match) return NaN;

    const [, numberStr, suffix] = match;
    const number = parseFloat(numberStr);

    // Get the multiplier based on suffix
    const multiplier = suffixMultipliers[suffix] || 1;

    return number * multiplier;
  } catch {
    return NaN;
  }
};

module.exports = parseNumber;
```

---

# FIX 4 — searchRoutes.js: Split rate limiters

**File:** `server/routes/searchRoutes.js`
**Lines:** 17-71

Replace the entire file with:

```js
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");

const searchController = require("../controllers/searchController");

const rateLimit = require("express-rate-limit");



const router = express.Router();



// Rate limiter for search/count/export operations

const searchLimiter = rateLimit({

  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 500, // 500 requests per 15 minutes per IP

  standardHeaders: true,

  legacyHeaders: false,

  message: { error: "Too many search requests. Please try again later." },

});


// Rate limiter for suggestion endpoints (typing-heavy, short window)

const suggestionLimiter = rateLimit({

  windowMs: 60 * 1000, // 1 minute

  max: 300, // 300 requests per minute per IP for fast typing

  standardHeaders: true,

  legacyHeaders: false,

  message: { error: "Too many suggestion requests. Please slow down." },

});



router.post("/", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.search);

router.post("/count", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getSearchCount);

router.post("/batch", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.searchBatch);

router.post("/batch/next", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.searchBatchNext);

router.post("/export-csv", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.exportContactsCsv);

router.post("/export", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.exportContactsCsv);

router.post("/details", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getItemDetailsByIds);

router.post("/find-leads", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.findLeads);

router.get("/filter-counts", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getFilterCounts);

router.post("/save-share-state", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.saveShareState);

router.get("/share-state/:shareId", searchLimiter, searchController.getShareState);

router.get("/city-suggestions", suggestionLimiter, authMiddleware, workspaceContextMiddleware, searchController.getCitySuggestions);

router.get("/company-domain-suggestions", suggestionLimiter, authMiddleware, workspaceContextMiddleware, searchController.getCompanyDomainSuggestions);

router.get("/keywords-suggestions", suggestionLimiter, authMiddleware, workspaceContextMiddleware, searchController.getKeywordsSuggestions);

router.get("/industry-suggestions", suggestionLimiter, authMiddleware, workspaceContextMiddleware, searchController.getIndustrySuggestions);

router.get("/name-suggestions", suggestionLimiter, authMiddleware, workspaceContextMiddleware, searchController.getPersonNameSuggestions);

router.post("/companies-count", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getUniqueCompaniesCount);

router.post("/companies-count-exact", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.getExactUniqueCompaniesCount);

router.post("/companies", searchLimiter, authMiddleware, workspaceContextMiddleware, searchController.searchCompanies);

module.exports = router;
```

---

# FIX 5 — searchService.js: Add cache stampede protection

**File:** `server/services/searchService.js`

**Insert A** — After line 798 (`timings.cache_hit = false;`), add:

```js
  // Stampede protection — only one request builds cache
  const lockKey = 'lock:' + cacheKey;
  const lockAcquired = await redisClient
    .set(lockKey, '1', { NX: true, EX: 10 })
    .catch(() => null);

  if (!lockAcquired) {
    await new Promise(r => setTimeout(r, 200));
    const retryCache = await redisClient.get(cacheKey).catch(() => null);
    if (retryCache) {
      timings.cache_hit = true;
      timings.total = `${(performance.now() - t_total).toFixed(2)}ms`;
      return JSON.parse(retryCache);
    }
  }
```

**Insert B** — Before line 997 (`return finalResponse;`), add:

```js
  await redisClient.del(lockKey).catch(() => {});
```

So the end of `executeSearch` becomes:

```js
  await redisClient.del(lockKey).catch(() => {});

  return finalResponse;
};
```

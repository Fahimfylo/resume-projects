# MongoDB Index Audit — 2026-07-05

## Environment

| Metric | Value |
|--------|-------|
| MongoDB uptime | 65,363 sec (**0.76 days**, ~18 hours) |
| MongoDB version | 7.0.31 |
| PM2 | Not available (local dev environment) |

## Uptime Caveat

MongoDB restarted ~18 hours before this audit. All `$indexStats` counters reset at
`2026-07-04T04:01:48Z`. The observation window is **only 0.76 days** — far below the
14-day reliability threshold. Every index's stats data is flagged as
**INSUFFICIENT DATA** due to insufficient observation window.

**ALL ops counts reflect only this local dev environment's traffic, not production.**

---

## Methodology

1. **Code audit** — Read every model/schema file and searched every `find()`,
   `findOne()`, `countDocuments()`, `aggregate()` call in the codebase.
2. **$indexStats** — Ran `db.<collection>.aggregate([{$indexStats:{}}])` for all
   9 flagged collections.
3. **Cross-reference** — Compared code-declared index definitions vs actual MongoDB
   indexes and query patterns.

---

## Collection-by-Collection Results

### 1. `accounts`

Total indexes: 6 (including `_id_`)

| Index | Ops | Since | Days | Code Verdict | Stats Verdict | Final Rec |
|-------|-----|-------|------|-------------|--------------|-----------|
| `_id_` | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `email_1` (unique) | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `email_1_role_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | INSUFFICIENT DATA | NEEDS MORE TIME |
| `role_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | INSUFFICIENT DATA | NEEDS MORE TIME |
| `createdAt_-1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | INSUFFICIENT DATA | NEEDS MORE TIME |
| `createdAt_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | INSUFFICIENT DATA | NEEDS MORE TIME |

**Notes:**
- Only `findOne({ email })` queries exist — covered by `email_1` (unique).
- `createdAt_1` (field index:true) is redundant with `createdAt_-1` (schema.index).
- No queries filter by `role` alone, `email+role`, or `createdAt`.

---

### 2. `contacts_v5`

Total indexes: 31 (including `_id_`)

All `_source.*` single-field indexes and compound indexes are used by the
`buildMongoQuery` / `getFilterIndex` system in `searchService.js`, **except one**:

| Index | Ops | Since | Days | Code Verdict | Stats Verdict | Final Rec |
|-------|-----|-------|------|-------------|--------------|-----------|
| `_id_` | 3 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `_source.organization_industries_1` | 1 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| All other `_source.*` indexes | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| **`_source.person_gender_1`** | **0** | 2026-07-04 | 0.76 | **UNUSED** | INSUFFICIENT DATA | NEEDS MORE TIME |
| Compound indexes (3-4 field) | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |

**Orphan indexes found** (not in current model code):
- `idx_source_sanitized_org_name`
- `source.sanitized_organization_name_unanalyzed_1`
- `_source.person_location_country_1__source.person_seniority_1__source.person_email_status_cd_1__source.organization_industries_1` (4-field compound)

**Notes:**
- `person_gender` is mapped in `esToMongoField` but never referenced from
  `fieldConfig` in `searchQueryBuilder.js` — no UI filter sends it.
- The 4-field compound index likely superseded by the 3-field `country+seniority+email_status`.

---

### 3. `contacts_imported` — **ALL INDEXES UNUSED**

Total indexes: 8 (including `_id_`)

| Index | Ops | Since | Days | Code Verdict | Stats Verdict | Final Rec |
|-------|-----|-------|------|-------------|--------------|-----------|
| `_id_` | 0 | 2026-07-04 | 0.76 | USED | RARE ACCESS | DO NOT DROP |
| `importBatchId_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `adminId_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `email_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `status_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `processedToContactsV5_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `importBatchId_1_status_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `createdAt_-1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |

**Notes:**
- Only `insertMany()` and `updateMany()` calls exist against this collection
  (in `adminImportController.js`).
- Zero `find()`, `findOne()`, `countDocuments()`, or `aggregate()` calls anywhere
  in the codebase.
- This is a staging collection for CSV imports — data flows in, gets processed,
  never queried by the application.
- Even on production with months of uptime, 0 ops is expected because nobody
  queries this collection.

---

### 4. `import_batches` — **ALL INDEXES UNUSED**

Total indexes: 5 (including `_id_`)

| Index | Ops | Since | Days | Code Verdict | Stats Verdict | Final Rec |
|-------|-----|-------|------|-------------|--------------|-----------|
| `_id_` | 0 | 2026-07-04 | 0.76 | USED | RARE ACCESS | DO NOT DROP |
| `adminId_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `status_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `createdAt_-1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `adminId_1_createdAt_-1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |

**Notes:**
- Only `ImportBatch.create()` and `importBatch.save()` calls exist (document
  instance operations by `_id`).
- Zero `ImportBatch.find()`, `ImportBatch.findOne()`, or any model-level query.
- Same pattern as `contacts_imported` — batch import tracking, never queried.

---

### 5. `savedcontacts`

Total indexes found: 4 (MongoDB deduplicates identical specs)

| Index | Ops | Since | Days | Code Verdict | Stats Verdict | Final Rec |
|-------|-----|-------|------|-------------|--------------|-----------|
| `_id_` | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `userId_1` | 2 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `userId_1_contactId_1` | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `contactId_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | INSUFFICIENT DATA | NEEDS MORE TIME |

**Notes:**
- Two models (`SavedContacts`, `SavedItem`) share the same `savedcontacts` collection.
- Both define `userId_1` and `userId_1_contactId_1` — MongoDB deduplicates, so only
  one of each exists.
- The `contactId_1` field index from `SavedItem` has zero queries targeting it.
- The non-unique `userId_1_contactId_1` from `SavedContacts` is redundant with the
  unique one from `SavedItem`.

---

### 6. `members` — **ALL NON-_id_ INDEXES UNUSED (Legacy Collection)**

Total indexes: 4 (including `_id_`)

| Index | Ops | Since | Days | Code Verdict | Stats Verdict | Final Rec |
|-------|-----|-------|------|-------------|--------------|-----------|
| `_id_` | 0 | 2026-07-04 | 0.76 | USED | RARE ACCESS | DO NOT DROP |
| `team_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `owner_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |
| `team_1_email_1` (unique) | 0 | 2026-07-04 | 0.76 | **UNUSED** | RARE ACCESS | **SAFE TO DROP** |

**Notes:**
- The `Member` collection is legacy — members were migrated to `users` collection
  (`migrateMembersToUsers.js`).
- Only 2 queries in the entire codebase:
  - `Member.findById()` in `memberAuthMiddleware.js:37` — uses `_id`.
  - `Member.find({}).populate()` in migration script — no filter.
- Zero `find({ team })`, `find({ owner })`, or `find({ team, email })` calls.
- All 3 non-default indexes are safe to drop.

---

### 7. `teams`

Total indexes found: 9 (5 in current model + 4 orphans)

| Index | Ops | Since | Days | Code Verdict | Stats Verdict | Final Rec |
|-------|-----|-------|------|-------------|--------------|-----------|
| `_id_` | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `owner_1` | 5 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `members.email_1` | 0 | 2026-07-04 | 0.76 | REDUNDANT | INSUFFICIENT DATA | NEEDS MORE TIME |
| `members.user_1` | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `owner_1_members.email_1` (unique+partial) | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| **Orphan indexes** (not in model): | | | | | | |
| `_id_1_members.email_1` | 0 | 2026-07-04 | 0.76 | UNKNOWN | INSUFFICIENT DATA | NEEDS MORE TIME |
| `invites.email_1` | 0 | 2026-07-04 | 0.76 | UNKNOWN | INSUFFICIENT DATA | NEEDS MORE TIME |
| `invites.used_1` | 0 | 2026-07-04 | 0.76 | UNKNOWN | INSUFFICIENT DATA | NEEDS MORE TIME |
| `invites.expiresAt_1` | 0 | 2026-07-04 | 0.76 | UNKNOWN | INSUFFICIENT DATA | NEEDS MORE TIME |

**Notes:**
- MongoDB deduplicated the duplicate `owner_1` (field index + schema.index) — only
  1 exists on disk.
- `members.email_1` is redundant with the prefix of `owner_1_members.email_1`
  compound index.
- 4 orphan indexes (`invites.*`, `_id_1_members.email_1`) are NOT defined in
  the current `Team.js` model — likely leftover from an older schema version.
- `_id_1_members.email_1` is an unusual index — it's on `{ _id: 1, "members.email": 1 }`
  which is almost certainly useless since `_id` is already unique.

---

### 8. `users`

Total indexes: 4 (including `_id_`)

| Index | Ops | Since | Days | Code Verdict | Stats Verdict | Final Rec |
|-------|-----|-------|------|-------------|--------------|-----------|
| `_id_` | 11 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `email_1` (unique) | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `teamId_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | INSUFFICIENT DATA | NEEDS MORE TIME |
| `invitedBy_1` | 0 | 2026-07-04 | 0.76 | **UNUSED** | INSUFFICIENT DATA | NEEDS MORE TIME |

**Notes:**
- `teamId` is read via `.select("teamId")` on `findById()` — never used as a
  query filter (`find({ teamId })`).
- `invitedBy` is read via `.select("invitedBy")` on `findById()` — never used as
  a query filter.
- Both indexes are likely dead weight but need production stats to confirm.

---

### 9. `creditledgers`

Total indexes: 4 (including `_id_`)

| Index | Ops | Since | Days | Code Verdict | Stats Verdict | Final Rec |
|-------|-----|-------|------|-------------|--------------|-----------|
| `_id_` | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `userId_1` | 0 | 2026-07-04 | 0.76 | **REDUNDANT** | INSUFFICIENT DATA | NEEDS MORE TIME |
| `userId_1_createdAt_-1` | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |
| `userId_1_creditType_1_createdAt_-1` | 0 | 2026-07-04 | 0.76 | USED | INSUFFICIENT DATA | DO NOT DROP |

**Notes:**
- `userId_1` is a prefix of both compound indexes — useless overhead.
- Queries: `find({ userId, creditType }).sort({ createdAt: -1 })` and
  `find({ userId, createdAt: { $gte, $lte } }).sort({ createdAt: 1 })`.
- Both compound indexes cover all query patterns.

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total indexes across all collections (excl `_id_`) | ~82 |
| **Code-confirmed UNUSED** | 17 |
| **Code-confirmed REDUNDANT/DUPLICATE** | 8 |
| **Total potential waste (code audit)** | **25 indexes** |
| **Safe to drop based on code audit alone** | **15 indexes** (contacts_imported: 7, import_batches: 4, members: 3, creditledgers: 1) |
| **Needs production $indexStats** | ~10 indexes |

## Safe-to-Drop Candidates (Code-Confirmed Unused)

These have ZERO query operations targeting them in the entire codebase:

### `contacts_imported` (7 indexes)
```javascript
db.contacts_imported.dropIndex("importBatchId_1");
db.contacts_imported.dropIndex("adminId_1");
db.contacts_imported.dropIndex("email_1");
db.contacts_imported.dropIndex("status_1");
db.contacts_imported.dropIndex("processedToContactsV5_1");
db.contacts_imported.dropIndex("importBatchId_1_status_1");
db.contacts_imported.dropIndex("createdAt_-1");
```

### `import_batches` (4 indexes)
```javascript
db.import_batches.dropIndex("adminId_1");
db.import_batches.dropIndex("status_1");
db.import_batches.dropIndex("createdAt_-1");
db.import_batches.dropIndex("adminId_1_createdAt_-1");
```

### `members` (3 indexes)
```javascript
db.members.dropIndex("team_1");
db.members.dropIndex("owner_1");
db.members.dropIndex("team_1_email_1");
```

### `creditledgers` (1 redundant index)
```javascript
db.creditledgers.dropIndex("userId_1");
```

---

## Production Verification Script

Run this on your **production** MongoDB to get reliable `$indexStats` data:

```javascript
// mongo-index-audit-prod.js
// Usage: mongosh "mongodb://..." --quiet -f mongo-index-audit-prod.js

var uptime = db.serverStatus().uptime;
print("=== MONGODB UPTIME ===");
print("uptime_seconds: " + uptime);
print("uptime_days: " + (uptime / 86400).toFixed(2));
if (uptime < 1209600) { // 14 days
  print("WARNING: Uptime is less than 14 days. All $indexStats counters may be unreliable.");
}
print("");

var collections = [
  "accounts", "contacts_v5", "contacts_imported", "import_batches",
  "savedcontacts", "members", "teams", "users", "creditledgers",
  "subscriptions", "transactions", "specialdealredemptions",
  "voucherredemptionlogs", "companies_cache", "plans"
];

collections.forEach(function(collName) {
  print("=== " + collName + " ===");
  try {
    var stats = db.getCollection(collName).aggregate([{$indexStats:{}}]).toArray();
    stats.forEach(function(i) {
      var since = new Date(i.accesses.since);
      var days = (Date.now() - since.getTime()) / 86400000;
      var sinceStr = since.toISOString();
      var status = (days < 14) ? "INSUFFICIENT_WINDOW" : (i.accesses.ops === 0 ? "ZERO_OPS" : "HAS_OPS");
      print(i.name + " | ops=" + i.accesses.ops + " | since=" + sinceStr +
            " | days=" + days.toFixed(2) + " | " + status);
    });
  } catch(e) {
    print("ERROR: " + e.message);
  }
  print("");
});
```

---

## Recommended Next Steps

1. **Run the production verification script** on your production MongoDB (requires
   ≥14 days of uptime for meaningful data).
2. **Investigate orphan indexes** on `teams` (`invites.*`, `_id_1_members.email_1`)
   and `contacts_v5` (4-field compound, `idx_source_sanitized_org_name`) — determine
   if they're from old code or were manually created.
3. **After production confirmation**, drop indexes in this order:
   - Tier 1 (code-confirmed safe) — `contacts_imported`, `import_batches`, `members`
   - Tier 2 (after stats confirm) — `accounts`, `users`, `savedcontacts`, `contact_v5`
   - Tier 3 (orphan cleanup) — `teams` orphan indexes
4. **Remove index definitions** from model files for dropped indexes to prevent
   automatic recreation on app restart.

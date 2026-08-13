# `/companies` (Company Search) — Filters Audit

**Endpoint:** `POST /api/search/companies` → `executeCompanySearch()` → `buildMongoQuery()` → MongoDB `contacts_v5` aggregation

## Filter Table

| # | Filter (UI) | Sidebar Key | Mapped API Key | fieldConfig Key | MongoDB `_source.*` Path | Query Type |
|---|---|---|---|---|---|---|
| 1 | Company | `company` | `organizationName` | `organizationName` | `_source.organization_name` | prefix `$regex` |
| 2 | City / State | `cityState` | `cityState` | `cityState` | `_source.person_location_city` + `_source.person_location_state` | prefix `$regex` |
| 3 | Country | `country` | `country` | `country` | `_source.person_location_country` | `$in` exact |
| 4 | Zip / Postal | `zip` | `zip` | `zip` | `_source.person_location_postal_code` | prefix `$regex` |
| 5 | Location | `location` | `location` | `location` | `_source.person_location_city` + `state` + `country` + `postal_code` | prefix `$regex` |
| 6 | Industry | `industry` | `industry` | `industry` | `_source.organization_industries` | `$in` exact |
| 7 | Keywords | `keywords` | `keywords` | `keywords` | `_source.organization_keywords` | `$regex` (and) |
| 8 | Employees | `employees` | `employeeRange` | `employeeRange` | `_source.organization_num_current_employees` | range `$gte`/`$lte` |
| 9 | Domain | `domain` | `organizationDomain` | `organizationDomain` | `_source.organization_domain` + `_source.organization_website_url` | prefix `$regex` |

## Current State

- **Active path:** `executeCompanySearch()` (lines 570-653 of `server/services/searchService.js`)
- Uses MongoDB `$group` aggregation on `_source.organization_name` to deduplicate companies
- Same `buildMongoQuery()` as contacts search — identical field mapping

## Key Differences from `/search`

| Aspect | `/companies` | `/search` |
|---|---|---|
| Data method | `$group` aggregation | `find()` |
| Dedup | By `_source.organization_name` | None (returns individual contacts) |
| `viewType` | Not used | `total` / `new` / `saved` |
| `sortOrder` | Not used (always sorted by `organization_name` asc) | `ascending` / `descending` |
| `list` filter | Uses separate `GET /api/saved-companies/list` | Included in filter payload |
| Has company filter | Hardcoded `hasCompany: true` | Optional |

## Related Endpoints

### `GET /api/search/companies-count`

- **File:** `searchController.getUniqueCompaniesCount()` (lines 1230-1622)
- Queries **two** ES indexes:
  1. `contacts_search` → `contacts_total` (count of contacts with matching company fields)
  2. `companies` → `companies_total` (count from separate companies index)
- Builds ES queries manually (not via `fieldConfig`) using `company_*` / `organization_*` field names

### Sidebar mapping (CompanyContainer.jsx)

| Sidebar Key | Mapped to API | 
|---|---|
| `company` | `organizationName` |
| `domain` | `organizationDomain` |
| `cityState` | `cityState` |
| `country` | `country` |
| `zip` | `zip` |
| `location` | `location` |
| `industry` | `industry` |
| `employees` | `employeeRange` |
| `keywords` | `keywords` |

## ES Index Fields Required

All fields needed by `buildMongoQuery()` are the same as `/search`. Additionally:

### For `getUniqueCompaniesCount` (contacts_search queries)
| Field | Type | Used In |
|---|---|---|
| `company_name` | keyword | Company filter, exists check |
| `company_name.keyword` | keyword | Wildcard query |
| `company_domain.keyword` | keyword | Domain dedup aggregation |
| `company_website` | keyword | Domain filter fallback |
| `company_city` | keyword | City filter |
| `company_state` | keyword | State filter |
| `company_country` | keyword | Country filter |
| `company_postal_code` | keyword | ZIP filter |
| `postal_code` | keyword | ZIP filter |
| `employee_count` | integer | Employee range |
| `industry.keyword` | keyword | Industry wildcard |
| `keywords` | keyword | Keywords match |
| `organization_id.keyword` | keyword | ID-based dedup aggregation |
| `organization_name` | keyword | Name-based dedup |

### For `getUniqueCompaniesCount` (companies index queries)
| Field | Type |
|---|---|
| `organization_name` | keyword |
| `organization_name.keyword` | keyword |
| `company_name` | keyword |
| `company_name.keyword` | keyword |
| `domain.keyword` | keyword |
| `location` | keyword |
| `location.keyword` | keyword |
| `industry.keyword` | keyword |
| `company_city` | keyword |
| `company_state` | keyword |
| `company_country` | keyword |
| `company_postal_code` | keyword |
| `employee_range.keyword` | keyword |
| `keywords` | keyword |

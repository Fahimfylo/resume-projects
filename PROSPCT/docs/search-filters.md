# `/search` (Contacts Search) — Filters Audit

**Endpoint:** `POST /api/search` → `executeSearch()` → `buildMongoQuery()` → MongoDB `contacts_v5`

## Filter Table

| # | Filter (UI) | Frontend Key | fieldConfig Key | ES Field Queried | MongoDB `_source.*` Path | Query Type | ES Index Field Needed |
|---|---|---|---|---|---|---|---|
| 1 | Country | `countries` | `countries` | `company_country` | `_source.person_location_country` | `$in` exact | `company_country` (keyword) |
| 2 | City / State | `city` | `city` | `company_city` | `_source.person_location_city` | prefix `$regex` | `company_city` (keyword) |
| 3 | ZIP / Postal | `zip` | `zip` | `company_postal_code`, `postal_code` | `_source.person_location_postal_code` | prefix `$regex` | `company_postal_code`, `postal_code` (keyword) |
| 4 | Job Title | `jobTitle` | `jobTitle` | `title` | `_source.person_title` | prefix `$regex` | `title` (keyword) |
| 5 | List | `list` | *(external)* | *(resolved to IDs)* | `_id: { $in: [...] }` | `$in` | *(not ES-filtered)* |
| 6 | Industry | `industry` | `industry` | `industry` | `_source.organization_industries` | `$in` exact | `industry` (keyword) |
| 7 | Keywords | `keywords` | `keywords` | `keywords` | `_source.organization_keywords` | `$regex` (and) | `keywords` (keyword) |
| 8 | Seniority | `seniority` | `seniority` | `seniority` | `_source.person_seniority` | `$in` exact | `seniority` (keyword) |
| 9 | Name | `personName` | `personName` | `full_name` | `_source.person_first_name_unanalyzed` OR `_source.person_last_name_unanalyzed` | prefix `$regex` (`$or`) | `full_name`, `person_first_name_unanalyzed`, `person_last_name_unanalyzed` |
| 10 | Employees | `employeeRange` | `employeeRange` | `employee_count` | `_source.organization_num_current_employees` | range `$gte`/`$lte` | `employee_count` (integer) |
| 11 | Annual Revenue | `revenueRange` | `revenueRange` | `revenue` | `_source.organization_revenue_in_thousands_int` | range `$gte`/`$lte` | `revenue` (long) |
| 12 | Email Status | `emailStatus` | `emailStatus` | `email_status` | `_source.person_email_status_cd` | `$in` exact | `email_status` (keyword) |
| 13 | Email Type | `emailType` | *(external)* | `email` | `_source.person_email` | prefix `$regex` | `email` (keyword) |
| 14 | Founded Year | `foundedYear` | *(external)* | `founded_year`, `organization_founded_year` | `_source.organization_founded_year` | range `$gte`/`$lte` | `founded_year` (integer) |
| 15 | Company Name | `organizationName` | `organizationName` | `company_name.keyword` | `_source.organization_name` | prefix `$regex` | `company_name` (keyword) |

### Feature-gated filters (require plan upgrade)

| Filter | Frontend Key | fieldConfig Key | ES Field | MongoDB `_source.*` | Query | ES Field Needed |
|---|---|---|---|---|---|---|
| Technologies | `technologies` | `technologies` | `technologies` | `_source.organization_current_technologies` | `$in` exact | `technologies` (keyword) |
| Revenue (thousands) | `revenueThousands` | `revenueThousands` | `revenue` | `_source.organization_revenue_in_thousands_int` | range | `revenue` (long) |

## Current State

- **Active path:** `buildMongoQuery()` (lines 60-247 of `server/services/searchService.js`) → MongoDB `contacts_v5`
- **ES block** (lines 362-402) is **commented out**

## To Switch to ES

1. Uncomment lines 362-402 in `server/services/searchService.js`
2. Remove/comment lines 404-565 (MongoDB fallback)
3. ES `fieldConfig` keys map directly to ES index fields

## ES Index Fields Required

### Person
| Field | Type | Filter |
|---|---|---|
| `full_name` | keyword + lowercase | Name |
| `person_first_name_unanalyzed` | keyword + lowercase | Name |
| `person_last_name_unanalyzed` | keyword + lowercase | Name |
| `person_title` | keyword + lowercase | Job Title |
| `person_seniority` | keyword | Seniority |
| `person_email` | keyword + lowercase | Email Type |
| `person_email_status_cd` | keyword | Email Status |
| `person_location_country` | keyword + lowercase | Country |
| `person_location_city` | keyword + lowercase | City |
| `person_location_state` | keyword + lowercase | City/State |
| `person_location_postal_code` | keyword | ZIP |

### Company
| Field | Type | Filter |
|---|---|---|
| `organization_name` | keyword + lowercase | Company Name |
| `organization_industries` | keyword + lowercase | Industry |
| `organization_keywords` | keyword + lowercase | Keywords |
| `organization_current_technologies` | keyword + lowercase | Technologies |
| `organization_num_current_employees` | integer | Employees |
| `organization_revenue_in_thousands_int` | long | Revenue |
| `organization_founded_year` | integer | Founded Year |

### Aliases (flat ES field names used by fieldConfig)
| Field | Type | Maps From |
|---|---|---|
| `company_name` | keyword + lowercase | `organization_name` |
| `company_city` | keyword + lowercase | `organization_hq_location_city` \| `person_location_city` |
| `company_state` | keyword + lowercase | `organization_hq_location_state` \| `person_location_state` |
| `company_country` | keyword + lowercase | `organization_hq_location_country` \| `person_location_country` |
| `company_postal_code` | keyword | `organization_hq_location_postal_code` \| `person_location_postal_code` |
| `postal_code` | keyword | = `company_postal_code` |
| `employee_count` | integer | `organization_num_current_employees` |
| `industry` | keyword + lowercase | `organization_industries[0]` |
| `keywords` | keyword + lowercase | merged org keywords |
| `email` | keyword + lowercase | `person_email` |
| `email_status` | keyword | `person_email_status_cd` |
| `seniority` | keyword | `person_seniority` |
| `title` | keyword + lowercase | `person_title` |
| `founded_year` | integer | `organization_founded_year` |
| `revenue` | long | `organization_revenue_in_thousands_int` |
| `technologies` | keyword + lowercase | `organization_current_technologies` |

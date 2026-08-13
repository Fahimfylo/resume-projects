# Search Filters Audit

## Audit 1: `/search` (Contacts Search)

**Endpoint:** `POST /api/search` → `executeSearch()` → `buildMongoQuery()` → MongoDB `contacts_v5`

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

**Feature-gated** (require plan upgrade):
| # | Filter | Frontend Key | fieldConfig Key | ES Field | MongoDB `_source.*` | Query | ES Field |
|---|---|---|---|---|---|---|---|
| 16 | Technologies | `technologies` | `technologies` | `technologies` | `_source.organization_current_technologies` | `$in` exact | `technologies` (keyword) |
| 17 | Revenue (thousands) | `revenueThousands` | `revenueThousands` | `revenue` | `_source.organization_revenue_in_thousands_int` | range | `revenue` (long) |

**Current execution path:** `buildMongoQuery()` (lines 60-247) → MongoDB `contacts_v5`. ES block (lines 362-402) is **commented out**.

**To switch to ES:** Uncomment lines 362-402, remove/comment lines 404-565 in `server/services/searchService.js`.

---

## Audit 2: `/companies` (Company Search)

**Endpoint:** `POST /api/search/companies` → `executeCompanySearch()` → `buildMongoQuery()` → MongoDB `contacts_v5` aggregation

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

**Current execution path:** `executeCompanySearch()` (lines 570-653) → MongoDB `$group` aggregation on `_source.organization_name`.

**Key differences from `/search`:**
- Uses `$group` aggregation (deduplicates by company), not `find()`
- No `viewType`, `sortOrder`, or `list` filters
- `getUniqueCompaniesCount` (separate endpoint) queries **two** ES indexes: `contacts_search` + `companies`

---

## Summary: All Fields ES Index Must Have

For the `contacts_search` ES index to serve both `/search` and `/companies`:

### Person Fields
| Field | Type | Used By |
|---|---|---|
| `full_name` | keyword + lowercase normalizer | Name filter |
| `person_first_name_unanalyzed` | keyword + lowercase normalizer | Name filter |
| `person_last_name_unanalyzed` | keyword + lowercase normalizer | Name filter |
| `person_title` | keyword + lowercase normalizer | Job Title filter |
| `person_seniority` | keyword | Seniority filter |
| `person_email` | keyword + lowercase normalizer | Email Type filter |
| `person_email_status_cd` | keyword | Email Status filter |
| `person_linkedin_url` | keyword + lowercase normalizer | findLeads |
| `person_gender` | keyword | (legacy, no UI) |
| `person_location_country` | keyword + lowercase normalizer | Country filter |
| `person_location_city` | keyword + lowercase normalizer | City filter |
| `person_location_state` | keyword + lowercase normalizer | City/State filter |
| `person_location_postal_code` | keyword | ZIP filter |

### Company Fields
| Field | Type | Used By |
|---|---|---|
| `organization_name` | keyword + lowercase normalizer | Company Name filter |
| `organization_industries` | keyword + lowercase normalizer | Industry filter |
| `organization_keywords` | keyword + lowercase normalizer | Keywords filter |
| `organization_current_technologies` | keyword + lowercase normalizer | Technologies filter |
| `organization_num_current_employees` | integer | Employees filter |
| `organization_revenue_in_thousands_int` | long | Revenue filter |
| `organization_founded_year` | integer | Founded Year filter |
| `organization_domain` | keyword + lowercase normalizer | Domain filter |
| `organization_website_url` | keyword + lowercase normalizer | Domain filter |
| `organization_linkedin_url` | keyword + lowercase normalizer | findLeads |

### Alias Fields (searchController uses `company_*` style)
| Field | Type | Maps From | Used By |
|---|---|---|---|
| `company_name` | keyword + lowercase normalizer | `organization_name` | Company filter |
| `company_domain` | keyword + lowercase normalizer | `organization_domain` | Domain filter |
| `company_website` | keyword + lowercase normalizer | `organization_website_url` | Domain filter |
| `company_city` | keyword + lowercase normalizer | `organization_hq_location_city` \| `person_location_city` | City filter |
| `company_state` | keyword + lowercase normalizer | `organization_hq_location_state` \| `person_location_state` | City/State filter |
| `company_country` | keyword + lowercase normalizer | `organization_hq_location_country` \| `person_location_country` | Country filter |
| `company_postal_code` | keyword | `organization_hq_location_postal_code` \| `person_location_postal_code` | ZIP filter |
| `postal_code` | keyword | (same as company_postal_code) | ZIP filter |
| `employee_count` | integer | `organization_num_current_employees` | Employees filter |
| `employee_range` | keyword | label from employee_count | Companies index query |
| `industry` | keyword + lowercase normalizer | `organization_industries[0]` | Industry filter |
| `keywords` | keyword + lowercase normalizer | merged from org keywords | Keywords filter |
| `email` | keyword + lowercase normalizer | `person_email` | Email Type filter |
| `email_status` | keyword | `person_email_status_cd` | Email Status filter |
| `seniority` | keyword | `person_seniority` | Seniority filter |
| `title` | keyword + lowercase normalizer | `person_title` | Job Title filter |
| `founded_year` | integer | `organization_founded_year` | Founded Year filter |
| `revenue` | long | `organization_revenue_in_thousands_int` | Revenue filter |
| `revenue_range` | keyword | label from revenue | Companies index query |
| `technologies` | keyword + lowercase normalizer | `organization_current_technologies` | Technologies filter |
| `linkedin_url` | keyword + lowercase normalizer | `person_linkedin_url` | findLeads |
| `company_linkedin_url` | keyword + lowercase normalizer | `organization_linkedin_url` | findLeads |

const toProperCase = (v) => String(v).replace(/\b\w/g, (c) => c.toUpperCase());
const toLower = (v) => String(v).toLowerCase();

// ─────────────────────────────────────────────────────────────────────────────
// fieldConfig: maps a client-side filter key to a MongoDB query strategy.
//
// The esField/esFields names match the ES-era naming and are translated to
// actual MongoDB field paths via toMongoPath() in searchService.js.
//
// Filters handled externally (not via fieldConfig):
//   list         — resolved to contact IDs in searchService before query build
//   foundedYear  — built as a range query directly in buildMongoQuery
// ─────────────────────────────────────────────────────────────────────────────
const fieldConfig = {
  // ── Person location ──────────────────────────────────────────────────────
  countries:    { type: "keyword",           esField: "company_country",    transform: toProperCase },
  city:         { type: "wildcard",          esField: "company_city", transform: toProperCase, usePrefix: true },
  zip:          { type: "wildcard",          esField: "company_postal_code", usePrefix: true },
  cityState:    { type: "location_search",   esFields: ["company_city", "company_state"] },
  country:      { type: "keyword",           esField: "company_country",    transform: toProperCase },

  // ── Unified location filter (searches city + state + country + ZIP) ──────
  location:     { type: "location_search",   esFields: ["company_city", "company_state"] },

  // ── Person attributes ────────────────────────────────────────────────────
  emailStatus:  { type: "keyword",           esField: "email_status",       transform: toProperCase },
  seniority:    { type: "keyword",           esField: "seniority",      transform: toLower },

  // Job title: stored as plain string 'title' in the flat ES index
  jobTitle:     { type: "keyword",           esField: "title" },
  jobFunction:  { type: "keyword",           esField: "job_functions.name", transform: toLower },

  // ── Person identifiers ────────────────────────────────────────────────────
  personName:          { type: "match_phrase_prefix", esField: "full_name" },
  person_name:         { type: "match_phrase_prefix", esField: "full_name" },
  personEmail:         { type: "wildcard",            esFields: ["email", "email.keyword"],       usePrefix: true, caseInsensitive: true },
  person_email:        { type: "wildcard",            esFields: ["email", "email.keyword"],       usePrefix: true, caseInsensitive: true },

  // ── Company attributes ────────────────────────────────────────────────────
  organizationName:         { type: "wildcard", esField: "company_name.keyword", useKeywordSuffix: false, usePrefix: true },
  organization_name:        { type: "wildcard", esField: "company_name.keyword", useKeywordSuffix: false, usePrefix: true },
  organizationDomain:       { type: "wildcard", esFields: ["organization_domain"], useKeywordSuffix: false, usePrefix: true },
  organization_domain:      { type: "wildcard", esFields: ["organization_domain"], useKeywordSuffix: false, usePrefix: true },
  organizationLinkedinUrl:  { type: "wildcard", esField: "company_linkedin_url", useKeywordSuffix: false, usePrefix: true, caseInsensitive: true },
  organization_linkedin_url:{ type: "wildcard", esField: "company_linkedin_url", useKeywordSuffix: false, usePrefix: true, caseInsensitive: true },
  personLinkedinUrl:        { type: "wildcard", esField: "linkedin_url", useKeywordSuffix: false, usePrefix: true, caseInsensitive: true },
  person_linkedin_url:      { type: "wildcard", esField: "linkedin_url", useKeywordSuffix: false, usePrefix: true, caseInsensitive: true },

  // ── Company classification ────────────────────────────────────────────────
  // industry is stored as a lowercase string (e.g. "consumer goods") — dropdown selection, exact match via $in
  industry:     { type: "keyword", esField: "industry", transform: toLower, useKeywordSuffix: false },
  // technologies is an array of lowercase slug strings (e.g. "gmail", "asp_net")
  technologies: { type: "keyword",  esField: "technologies",   transform: toLower, useKeywordSuffix: false },
  // keywords is the organization's keyword array — exact $in match
  keywords:     { type: "keyword",  esField: "keywords",        transform: toLower, useKeywordSuffix: false },

  // ── Numeric ranges ────────────────────────────────────────────────────────
  // employee_count is the numeric headcount field confirmed in the ES index
  employeeRange: {
    type: "range",
    esField: "employee_count",
    rangeKeywordField: "employee_range",
    divider: 1,
  },
  // Revenue is stored in thousands; UI strings are in full dollars (M/B notation)
  revenueRange: {
    type: "range",
    esField: "revenue",
    rangeKeywordField: "revenue_range",
    divider: 1000,
  },
  revenueThousands: { type: "range", esField: "revenue" },

  // Company-only filter - checks if record has company data
  hasCompany: { type: "exists", esFields: ["company_name", "organization_name"] },

  // ── Email domain type (keyword $in on dedicated indexed field) ────────────
  // Person email domain is stored in a dedicated field and indexed for fast $in lookups.
  // The transform strips "@" prefix from filter values ("@gmail.com" → "gmail.com").
  emailType: { type: "wildcard", esFields: ["email", "person_email"], usePrefix: false, caseInsensitive: true, transform: (v) => `*${v}` },
};

// ── Legacy Elasticsearch query builders (replaced by buildMongoQuery) ─────
// These are kept for reference but no longer used. The MongoDB-equivalent
// logic lives in searchService.js buildMongoQuery().
//
// const buildBaseQuery = ...
// const buildEffectiveQuery = ...

module.exports = {
  fieldConfig
};

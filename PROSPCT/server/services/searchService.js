const { performance } = require("perf_hooks");
const SavedItem = require("../models/SavedItem");
const SavedContacts = require("../models/SavedContacts");
const logger = require("../utils/logger");
const { fieldConfig } = require("../utils/searchQueryBuilder");
const parseNumber = require("../utils/parseNumber");
const esClient = require("../config/elasticsearch");

// ── ES→MongoDB field name mapping (kept for buildMongoQuery, used by savedController.js) ─
const esToMongoField = {
  company_country:              'person_location_country',
  company_city:                 'person_location_city',
  company_state:                'person_location_state',
  company_postal_code:          'person_location_postal_code',
  postal_code:                  'person_location_postal_code',
  email_status:                 'person_email_status_cd',
  person_gender:                'person_gender',
  seniority:                    'person_seniority',
  title:                        'person_title',
  email:                        'person_email',
  email_domain:                 'person_email_domain',
  linkedin_url:                 'person_linkedin_url',
  person_linkedin_url:          'person_linkedin_url',
  company_name:                 'organization_name',
  organization_name:            'organization_name',
  company_domain:               'organization_domain',
  organization_domain:          'organization_domain',
  company_linkedin_url:         'organization_linkedin_url',
  organization_linkedin_url:    'organization_linkedin_url',
  company_website:              'organization_website_url',
  website:                      'organization_website_url',
  industry:                     'organization_industries',
  technologies:                 'organization_current_technologies',
  keywords:                     'organization_keywords',
  employee_count:               'organization_num_current_employees',
  employee_range:               'organization_num_current_employees',
  revenue:                      'organization_revenue_in_thousands_int',
  revenue_range:                'organization_revenue_in_thousands_int',
  founded_year:                 'organization_founded_year',
  organization_founded_year:    'organization_founded_year',
  job_functions:                'job_functions',
  mobile_phone:                 'person_phone',
  company_phone:                'organization_phone',
  company_address:              'organization_hq_location_city',
  facebook_url:                 'organization_facebook_url',
  twitter_url:                  'organization_twitter_url',
};

const toMongoPath = (esField) => {
  const cleanField = esField.replace(/\.keyword$/, '');
  const camel = esToMongoField[cleanField] || cleanField;
  return `_source.${camel}`;
};

// ── MongoDB query builder (kept for savedController.js bulk-save) ─────────

function buildMongoQuery(filters, viewType, savedContactIds, listContactIds, excludedFilters = {}) {
  const query = {};
  const andClauses = [];
  const excludedClauses = [];

  // ─── Helper: parse a filter value into {$gte, $lte} ─────────────────
  const parseRange = (range) => {
    const cleanStr = String(range).replace(/\s/g, "").trim();
    const cond = {};
    if (cleanStr.includes("andmore") || cleanStr.includes("+")) {
      const numStr = cleanStr.replace("andmore", "").replace("+", "");
      const num = parseFloat(numStr);
      if (!isNaN(num)) cond.$gte = num;
    } else if (cleanStr.includes("-")) {
      const parts = cleanStr.split("-").filter(p => p.trim());
      if (parts.length === 2) {
        const minVal = parseFloat(parts[0]);
        const maxVal = parseFloat(parts[1]);
        if (!isNaN(minVal)) cond.$gte = minVal;
        if (!isNaN(maxVal)) cond.$lte = maxVal;
      }
    } else if (cleanStr.startsWith(">=")) {
      const num = parseFloat(cleanStr.slice(2));
      if (!isNaN(num)) cond.$gte = num;
    } else if (cleanStr.startsWith("<=")) {
      const num = parseFloat(cleanStr.slice(2));
      if (!isNaN(num)) cond.$lte = num;
    } else if (cleanStr.startsWith(">")) {
      const num = parseFloat(cleanStr.slice(1));
      if (!isNaN(num)) cond.$gt = num;
    } else if (cleanStr.startsWith("<")) {
      const num = parseFloat(cleanStr.slice(1));
      if (!isNaN(num)) cond.$lt = num;
    }
    return Object.keys(cond).length ? cond : null;
  };

  // ─── Helper: add $or clauses for a multi-value field ────────────────
  const addInClause = (field, values) => {
    if (values && values.length > 0) {
      andClauses.push({ [field]: { $in: values } });
    }
  };

  const addPrefixClause = (field, values) => {
    if (values && values.length > 0) {
      const or = values.map(v => ({ [field]: { $gte: v, $lt: v + '\uffff' } }));
      andClauses.push({ $or: or });
    }
  };

  const addWildcardClause = (field, values, caseInsensitive) => {
    if (values && values.length > 0) {
      const or = values.map(v => {
        const clean = String(v).toLowerCase();
        if (caseInsensitive) {
          return { [field]: { $regex: `.*${escapeRegex(clean)}.*`, $options: 'i' } };
        }
        return { [field]: { $regex: `.*${escapeRegex(clean)}.*` } };
      });
      andClauses.push({ $or: or });
    }
  };

  // ─── Process each filter key ────────────────────────────────────────
  Object.entries(filters).forEach(([key, values]) => {
    const config = fieldConfig[key];
    if (!config) return;

    const validValues = (Array.isArray(values) ? values : [values])
      .filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (validValues.length === 0) return;

    const processed = config.transform
      ? validValues.map(config.transform)
      : validValues;

    const mongoField = config.esField
      ? toMongoPath(config.esField)
      : (config.esFields ? config.esFields.map(f => toMongoPath(f)) : null);
    if (!mongoField) return;

    switch (config.type) {
      case "keyword":
        if (Array.isArray(mongoField)) {
          const orConditions = mongoField.flatMap(f =>
            processed.map(v => ({ [f]: v }))
          );
          andClauses.push({ $or: orConditions });
        } else {
          addInClause(mongoField, processed);
        }
        break;

      case "wildcard":
        if (Array.isArray(mongoField)) {
          const orConditions = mongoField.flatMap(f =>
            processed.map(v => ({ [f]: { $regex: `.*${escapeRegex(String(v))}.*`, $options: 'i' } }))
          );
          andClauses.push({ $or: orConditions });
        } else {
          addWildcardClause(mongoField, processed, config.caseInsensitive);
        }
        break;

      case "match":
      case "match_phrase":
        if (Array.isArray(mongoField)) {
          const orConditions = mongoField.flatMap(f =>
            processed.map(v => {
              const clean = String(v).toLowerCase();
              return config.usePrefix
                ? { [f]: { $gte: clean, $lt: clean + '\uffff' } }
                : { [f]: clean };
            })
          );
          andClauses.push({ $or: orConditions });
        } else {
          addPrefixClause(mongoField, processed);
        }
        break;

      case "match_phrase_prefix":
        if (String(processed[0]).length > 2) {
          addPrefixClause(mongoField, [processed[0]]);
        }
        break;

      case "range": {
        const rangeConditions = processed.map(r => {
          const cond = parseRange(r);
          return cond ? { [mongoField]: cond } : null;
        }).filter(Boolean);
        if (rangeConditions.length) {
          andClauses.push({ $or: rangeConditions });
        }
        break;
      }

      case "location_search": {
        if (Array.isArray(mongoField)) {
          const orConditions = mongoField.flatMap(f =>
            processed.map(v => ({ [f]: { $regex: `.*${escapeRegex(String(v))}.*`, $options: 'i' } }))
          );
          andClauses.push({ $or: orConditions });
        }
        break;
      }

      case "domain_match": {
        const shouldFields = [...mongoField, 'organization_website_url', 'organization_domain'];
        const orConditions = shouldFields.flatMap(f =>
          processed.map(v => ({ [toMongoPath(f)]: { $regex: `.*${escapeRegex(String(v))}.*`, $options: 'i' } }))
        );
        andClauses.push({ $or: orConditions });
        break;
      }

      case "exists": {
        const fields = Array.isArray(mongoField) ? mongoField : [mongoField];
        const orConditions = fields.map(f => ({ [f]: { $exists: true, $ne: null, $nin: ['', null] } }));
        andClauses.push({ $or: orConditions });
        break;
      }
    }
  });

  // ─── Excluded filters ─────────────────────────────────────────────
  Object.entries(excludedFilters).forEach(([key, values]) => {
    const config = fieldConfig[key];
    if (!config) return;

    const validValues = (Array.isArray(values) ? values : [values])
      .filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (validValues.length === 0) return;

    const mongoField = config.esField
      ? toMongoPath(config.esField)
      : (config.esFields ? config.esFields.map(f => toMongoPath(f)) : null);
    if (!mongoField) return;

    excludedClauses.push({ [Array.isArray(mongoField) ? mongoField[0] : mongoField]: { $nin: validValues } });
  });

  // ─── foundedYear ──────────────────────────────────────────────────
  if (filters.foundedYear && typeof filters.foundedYear === "object") {
    const { minYear, maxYear } = filters.foundedYear;
    const cond = {};
    if (minYear) cond.$gte = parseInt(minYear, 10);
    if (maxYear) cond.$lte = parseInt(maxYear, 10);
    if (Object.keys(cond).length) {
      andClauses.push({ '_source.organization_founded_year': cond });
    }
  }

  // ─── listContactIds ───────────────────────────────────────────────
  if (listContactIds && listContactIds.length > 0) {
    andClauses.push({ _id: { $in: listContactIds } });
  }

  // ─── viewType ─────────────────────────────────────────────────────
  if (viewType === "saved" && savedContactIds && savedContactIds.length > 0) {
    andClauses.push({ _id: { $in: savedContactIds } });
  } else if (viewType === "new" && savedContactIds && savedContactIds.length > 0) {
    excludedClauses.push({ _id: { $in: savedContactIds } });
  }

  // ─── Assemble ─────────────────────────────────────────────────────
  if (andClauses.length) query.$and = andClauses;
  if (excludedClauses.length) {
    query.$and = [...(query.$and || []), ...excludedClauses.map(c => ({ $nor: [c] }))];
  }

  return query;
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── ES Query Builders ──────────────────────────────────────────────────────

const esFieldForQuery = (config) => {
  const field = config.esField || null;
  return field ? field.replace(/\.keyword$/, '') : null;
};

const esFieldsForQuery = (config) => {
  const fields = config.esFields || (config.esField ? [config.esField] : null);
  if (!fields) return null;
  return fields.map(f => f.replace(/\.keyword$/, ''));
};

function esBuildRangeClause(esField, validValues, config) {
  const divider = config.divider || 1;
  const rangeConditions = validValues.map(range => {
    if (typeof range === "object") {
      const cond = {};
      if (range.gte != null) cond.gte = Number(range.gte) / divider;
      if (range.lte != null) cond.lte = Number(range.lte) / divider;
      if (range.gt != null) cond.gt = Number(range.gt) / divider;
      if (range.lt != null) cond.lt = Number(range.lt) / divider;
      return Object.keys(cond).length ? { range: { [esField]: cond } } : null;
    }
    const cleanStr = String(range).replace(/[\$,€£\s]/g, "").trim();
    const cond = {};
    if (cleanStr.includes("andmore")) {
      cond.gte = parseNumber(cleanStr.replace("andmore", "")) / divider;
    } else if (cleanStr.includes("-")) {
      const parts = cleanStr.split("-").filter(p => p.trim());
      if (parts.length === 2) {
        const minVal = parseNumber(parts[0]);
        const maxVal = parseNumber(parts[1]);
        if (!Number.isNaN(minVal)) cond.gte = minVal / divider;
        if (!Number.isNaN(maxVal)) cond.lte = maxVal / divider;
      }
    } else if (cleanStr.startsWith(">=")) {
      cond.gte = parseNumber(cleanStr.slice(2)) / divider;
    } else if (cleanStr.startsWith("<=")) {
      cond.lte = parseNumber(cleanStr.slice(2)) / divider;
    } else if (cleanStr.startsWith(">")) {
      cond.gt = parseNumber(cleanStr.slice(1)) / divider;
    } else if (cleanStr.startsWith("<")) {
      cond.lt = parseNumber(cleanStr.slice(1)) / divider;
    }
    Object.keys(cond).forEach(k => { if (Number.isNaN(cond[k])) delete cond[k]; });
    return Object.keys(cond).length ? { range: { [esField]: cond } } : null;
  }).filter(Boolean);
  return rangeConditions.length ? { bool: { should: rangeConditions } } : null;
}

function esBuildFilterClause(key, values, exclude = false) {
  const config = fieldConfig[key];
  if (!config) return null;

  const validValues = (Array.isArray(values) ? values : [values])
    .filter(v => v !== undefined && v !== null && String(v).trim() !== "");
  if (validValues.length === 0) return null;

  const processed = config.transform
    ? validValues.map(config.transform)
    : validValues;

  const occ = exclude ? 'must_not' : 'filter';

  switch (config.type) {
    case "keyword": {
      const esField = esFieldForQuery(config);
      if (!esField) return null;
      return { [occ]: [{ terms: { [esField]: processed } }] };
    }

    case "wildcard": {
      const targetFields = esFieldsForQuery(config);
      if (!targetFields) return null;
      const should = [];
      for (const val of processed) {
        const strVal = String(val);
        for (const esField of targetFields) {
          if (config.usePrefix) {
            should.push({ prefix: { [esField]: { value: strVal, case_insensitive: !!config.caseInsensitive } } });
          } else {
            should.push({ wildcard: { [esField]: { value: `*${strVal}*`, case_insensitive: !!config.caseInsensitive } } });
          }
        }
      }
      if (!should.length) return null;
      if (exclude) return { must_not: should };
      return { should, minimum_should_match: 1 };
    }

    case "match":
    case "match_phrase": {
      const esField = esFieldForQuery(config);
      if (!esField) return null;
      const should = processed.map(v => {
        if (config.usePrefix) {
          return { prefix: { [esField]: { value: String(v).toLowerCase(), case_insensitive: true } } };
        }
        return { term: { [esField]: { value: String(config.caseInsensitive ? v.toLowerCase() : v) } } };
      });
      if (!should.length) return null;
      if (exclude) return { must_not: should };
      return should.length === 1 ? { [occ]: should } : { should, minimum_should_match: 1 };
    }

    case "match_phrase_prefix": {
      const esField = esFieldForQuery(config);
      if (!esField) return null;
      if (String(validValues[0]).length <= 2) return null;
      if (exclude) {
        return { must_not: [{ prefix: { [esField]: { value: String(processed[0]).toLowerCase() } } }] };
      }
      return { [occ]: [{ prefix: { [esField]: { value: String(processed[0]).toLowerCase() } } }] };
    }

    case "range": {
      const esField = esFieldForQuery(config);
      if (!esField) return null;
      const clause = esBuildRangeClause(esField, validValues, config);
      if (!clause) return null;
      if (exclude) return { must_not: clause.bool.should };
      return { should: clause.bool.should, minimum_should_match: 1 };
    }

    case "location_search":
    case "zip_search": {
      const targetFields = esFieldsForQuery(config);
      if (!targetFields) return null;
      const should = [];
      for (const val of processed) {
        const strVal = String(val);
        for (const esField of targetFields) {
          should.push({ prefix: { [esField]: { value: strVal, case_insensitive: true } } });
        }
      }
      if (!should.length) return null;
      if (exclude) return { must_not: should };
      return { should, minimum_should_match: 1 };
    }

    case "domain_match": {
      const esField = esFieldForQuery(config);
      if (!esField) return null;
      const shouldFields = [esField, 'company_website', 'website', 'organization_website_url', 'organization_domain']
        .filter(Boolean);
      const should = [];
      for (const val of processed) {
        const strVal = String(val);
        for (const f of shouldFields) {
          should.push({ prefix: { [f]: { value: strVal, case_insensitive: true } } });
        }
      }
      if (!should.length) return null;
      if (exclude) return { must_not: should };
      return { should, minimum_should_match: 1 };
    }

    case "exists": {
      const targetFields = esFieldsForQuery(config);
      if (!targetFields) return null;
      const should = targetFields.map(f => ({ exists: { field: f } }));
      if (exclude) return { must_not: [{ bool: { should } }] };
      return { should, minimum_should_match: 1 };
    }

    default:
      return null;
  }
}

function buildESQuery(filters, viewType, savedContactIds, listContactIds, excludedFilters = {}) {
  const clauses = { filter: [], must_not: [] };

  const hasCityFilter = Array.isArray(filters.city) && filters.city.length > 0;
  const hasZipFilter = Array.isArray(filters.zip) && filters.zip.length > 0;

  Object.entries(filters).forEach(([key, values]) => {
    if (key === "location" && (hasCityFilter || hasZipFilter)) return;
    const clause = esBuildFilterClause(key, values, false);
    if (clause) {
      if (clause.filter) clauses.filter.push(...clause.filter);
      if (clause.must_not) clauses.must_not.push(...clause.must_not);
      if (clause.should) {
        clauses.filter.push({
          bool: { should: clause.should, minimum_should_match: clause.minimum_should_match || 1 },
        });
      }
    }
  });

  Object.entries(excludedFilters).forEach(([key, values]) => {
    const clause = esBuildFilterClause(key, values, true);
    if (clause) {
      if (clause.must_not) clauses.must_not.push(...clause.must_not);
      if (clause.filter) clauses.filter.push(...clause.filter);
    }
  });

  if (filters.foundedYear && typeof filters.foundedYear === "object") {
    const { minYear, maxYear } = filters.foundedYear;
    const cond = {};
    if (minYear) cond.gte = parseInt(minYear, 10);
    if (maxYear) cond.lte = parseInt(maxYear, 10);
    if (Object.keys(cond).length) {
      clauses.filter.push({ range: { organization_founded_year: cond } });
    }
  }

  // When filtering by personal email domain, only show contacts with company data
  if (filters.emailType?.length > 0) {
    clauses.filter.push({
      bool: {
        should: [
          { range: { employee_count: { gt: 0 } } },
          { exists: { field: "industry" } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  if (listContactIds.length > 0) {
    clauses.filter.push({ terms: { _id: listContactIds } });
  }

  if (viewType === "saved") {
    clauses.filter.push({ terms: { _id: savedContactIds } });
  }
  if (viewType === "new") {
    clauses.must_not.push({ terms: { _id: savedContactIds } });
  }

  const bool = {};
  if (clauses.filter.length) bool.filter = clauses.filter;
  if (clauses.must_not.length) bool.must_not = clauses.must_not;

  return Object.keys(bool).length ? { bool } : { match_all: {} };
}

// ── Resolve saved IDs ─────────────────────────────────────────────────────

async function resolveSavedIds(userId) {
  const [savedItemDocs, savedContactsDocs] = await Promise.all([
    SavedItem.find({ userId }).select("contactId").lean(),
    SavedContacts.find({ userId }).select("contactId").lean(),
  ]);
  return new Set([
    ...savedItemDocs.map(item => String(item.contactId)),
    ...savedContactsDocs.map(item => String(item.contactId)),
  ]);
}

// ── Resolve list contact IDs ────────────────────────────────────────────────

async function resolveListContactIds(userId, listNames) {
  if (!listNames || !Array.isArray(listNames) || listNames.length === 0) return [];
  const List = require("../models/List");
  const lists = await List.find({ userId, name: { $in: listNames } }).select("_id").lean();
  const listIds = lists.map(l => l._id);
  if (listIds.length === 0) return [];
  const listContacts = await SavedContacts.find({ userId, listIds: { $in: listIds } }).select("contactId").lean();
  return listContacts.map(sc => sc.contactId);
}

// ── Execute Search ──────────────────────────────────────────────────────────

async function executeSearch({ userId, filters = {}, excludedFilters = {} }) {
  const t_total = performance.now();
  const timings = {};

  const page = parseInt(filters.cursor) || parseInt(filters.currentPage) || parseInt(filters.page) || 1;
  const limit = Math.min(filters.limit || 25, 1000);
  const viewType = (filters.viewType || "total").toLowerCase();

  const savedContactIds = await resolveSavedIds(userId);
  const listContactIds = await resolveListContactIds(userId, filters.list);

  const esQuery = buildESQuery(filters, viewType, [...savedContactIds], listContactIds, excludedFilters);

  const esRes = await esClient.search({
    index: 'contacts_search',
    from: (page - 1) * limit,
    size: limit,
    query: esQuery,
    _source: true,
    track_total_hits: true,
  });

  const total = typeof esRes.hits.total === 'object' ? esRes.hits.total.value : esRes.hits.total;
  const totalPages = Math.ceil(total / limit);

  const results = esRes.hits.hits.map(hit => ({
    _id: hit._id,
    _source: hit._source || {},
    is_saved: savedContactIds.has(hit._id),
  }));

  timings.total = `${(performance.now() - t_total).toFixed(2)}ms`;
  // logger.info("[Search] Execution complete", { timings, page, onPage: results.length, total });

  return {
    results,
    counts: { onPage: results.length, total },
    page,
    nextCursor: page < totalPages ? page + 1 : null,
    hasMore: page < totalPages,
  };
}

// ── Execute Search Count ────────────────────────────────────────────────────

async function executeSearchCount({ userId, filters = {}, excludedFilters = {} }) {
  const savedContactIds = await resolveSavedIds(userId);
  const listContactIds = await resolveListContactIds(userId, filters.list);

  const totalQuery = buildESQuery(filters, "total", [...savedContactIds], listContactIds, excludedFilters);
  const savedQuery = buildESQuery(filters, "saved", [...savedContactIds], listContactIds, excludedFilters);

  const [totalRes, savedRes] = await Promise.all([
    esClient.count({ index: 'contacts_search', query: totalQuery }),
    esClient.count({ index: 'contacts_search', query: savedQuery }),
  ]);

  const [distinctItemIds, distinctContactIds] = await Promise.all([
    SavedItem.distinct('contactId', { userId }),
    SavedContacts.distinct('contactId', { userId }),
  ]);
  const uniqueSavedCount = new Set([
    ...distinctItemIds.map(id => String(id)),
    ...distinctContactIds.map(id => String(id)),
  ]).size;

  const total = totalRes.count;
  const esSaved = savedRes.count;
  return { total, saved: uniqueSavedCount, new: Math.max(0, total - esSaved) };
}

// ── Execute Company Search (ES aggregation-based) ───────────────────────────

async function executeCompanySearch({ userId, filters = {} }) {
  const buildBoolQuery = () => {
    const filter = [];
    const must = [];

    // Always require company data — matches the count endpoint's base query
    filter.push({
      bool: {
        should: [
          { exists: { field: "company_name" } },
          { exists: { field: "organization_name" } },
        ],
        minimum_should_match: 1,
      },
    });

    // Exclude email-like entries (e.g. "6x69cpk9hgq3tvb@marketplace.amazon.in")
    filter.push({
      bool: {
        must_not: [
          { wildcard: { "company_name": "*@*" } },
          { wildcard: { "organization_name": "*@*" } },
        ],
      },
    });

    // Only show contacts with a verified domain
    filter.push({ exists: { field: "company_domain" } });

    if (filters.organizationName) {
      const values = Array.isArray(filters.organizationName) ? filters.organizationName : [filters.organizationName];
      const should = values.flatMap(v => [
        { wildcard: { "company_name.keyword": { value: `*${v}*` } } },
        { wildcard: { "company_name": { value: `*${v}*` } } },
        { wildcard: { "organization_name": { value: `*${v}*` } } },
      ]);
      filter.push({ bool: { should, minimum_should_match: 1 } });
    }

    if (filters.organizationDomain) {
      const values = Array.isArray(filters.organizationDomain) ? filters.organizationDomain : [filters.organizationDomain];
      const should = values.flatMap(v => [
        { wildcard: { "company_domain.keyword": { value: `*${v}*` } } },
        { wildcard: { "company_domain": { value: `*${v}*` } } },
        { wildcard: { "company_website": { value: `*${v}*` } } },
      ]);
      filter.push({ bool: { should, minimum_should_match: 1 } });
    }

    if (filters.industry) {
      const values = Array.isArray(filters.industry) ? filters.industry : [filters.industry];
      const should = values.map(v => ({ match: { "industry": v } }));
      filter.push({ bool: { should, minimum_should_match: 1 } });
    }

    if (filters.country) {
      const values = Array.isArray(filters.country) ? filters.country : [filters.country];
      const should = values.map(v => ({ match: { "company_country": v } }));
      filter.push({ bool: { should, minimum_should_match: 1 } });
    }

    if (filters.location) {
      const values = Array.isArray(filters.location) ? filters.location : [filters.location];
      const should = values.flatMap(v => [
        { wildcard: { "company_city": { value: `*${v}*` } } },
        { wildcard: { "company_state": { value: `*${v}*` } } },
        { wildcard: { "company_country": { value: `*${v}*` } } },
        { wildcard: { "company_postal_code": { value: `*${v}*` } } },
        { wildcard: { "postal_code": { value: `*${v}*` } } },
      ]);
      filter.push({ bool: { should, minimum_should_match: 1 } });
    }

    if (filters.cityState) {
      const values = Array.isArray(filters.cityState) ? filters.cityState : [filters.cityState];
      const should = values.flatMap(v => [
        { wildcard: { "company_city": { value: `*${v}*` } } },
        { wildcard: { "company_state": { value: `*${v}*` } } },
      ]);
      filter.push({ bool: { should, minimum_should_match: 1 } });
    }

    if (filters.keywords) {
      const values = Array.isArray(filters.keywords) ? filters.keywords : [filters.keywords];
      const should = values.map(v => ({ match: { "keywords": { query: v, operator: "and" } } }));
      filter.push({ bool: { should, minimum_should_match: 1 } });
    }

    if (filters.zip) {
      const values = Array.isArray(filters.zip) ? filters.zip : [filters.zip];
      const should = values.flatMap(v => [
        { wildcard: { "company_postal_code": { value: `*${v}*` } } },
        { wildcard: { "postal_code": { value: `*${v}*` } } },
      ]);
      filter.push({ bool: { should, minimum_should_match: 1 } });
    }

    if (filters.employeeRange) {
      const values = Array.isArray(filters.employeeRange) ? filters.employeeRange : [filters.employeeRange];
      const rangeQueries = values.map(range => {
        const cleanStr = String(range).replace(/\s/g, "").trim();
        const rParams = {};
        if (cleanStr.includes("andmore") || cleanStr.includes("+")) {
          const numStr = cleanStr.replace("andmore", "").replace("+", "");
          const num = parseFloat(numStr);
          if (!isNaN(num)) rParams.gte = num;
        } else if (cleanStr.includes("-")) {
          const parts = cleanStr.split("-").filter(p => p.trim());
          if (parts.length === 2) {
            const minVal = parseFloat(parts[0]);
            const maxVal = parseFloat(parts[1]);
            if (!isNaN(minVal)) rParams.gte = minVal;
            if (!isNaN(maxVal)) rParams.lte = maxVal;
          }
        }
        return Object.keys(rParams).length ? { range: { "employee_count": rParams } } : null;
      }).filter(Boolean);
      if (rangeQueries.length) {
        filter.push({ bool: { should: rangeQueries, minimum_should_match: 1 } });
      }
    }

    if (filters.hasCompany === true || filters.hasCompany === "true") {
      filter.push({
        bool: {
          should: [
            { exists: { field: "company_name" } },
            { exists: { field: "organization_name" } },
          ],
          minimum_should_match: 1,
        },
      });
    }

    const bool = {};
    if (filter.length) bool.filter = filter;
    if (must.length) bool.must = must;
    return Object.keys(bool).length ? { bool } : { match_all: {} };
  };

  const query = buildBoolQuery();
  const size = Math.min(filters.limit ?? 25, 100);
  const after = filters.cursor ? JSON.parse(filters.cursor) : undefined;

  const esRes = await esClient.search({
    index: 'contacts_search',
    size: 0,
    query,
    aggs: {
      companies: {
        composite: {
          size,
          ...(after ? { after } : {}),
          sources: [
            { by_domain: { terms: { field: "company_domain" } } },
          ],
        },
        aggs: {
          top_hit: {
            top_hits: {
              size: 1,
              _source: ["organization_name", "company_name", "company_domain", "company_website", "organization_website_url", "employee_count", "company_city", "company_state", "company_country", "industry", "company_linkedin_url", "linkedin_url", "facebook_url", "twitter_url", "keywords", "organization_keywords", "organization_hq_location_postal_code", "company_postal_code", "company_zip"],
            },
          },
        },
      },
    },
    track_total_hits: false,
  });

  const buckets = esRes.aggregations?.companies?.buckets || [];
  const results = buckets.map(bucket => {
    const src = bucket.top_hit?.hits?.hits?.[0]?._source || {};
    const firstHit = bucket.top_hit?.hits?.hits?.[0];
    return {
      _id: firstHit?._id || `${bucket.key.by_domain}|${bucket.key.by_org}|${bucket.key.by_name}`,
      _source: {
        organization_name: src.organization_name || src.company_name || bucket.key.by_name || bucket.key.by_org || '',
        organization_domain: src.company_domain || src.organization_domain || '',
        organization_website_url: src.company_website || src.organization_website_url || '',
        employee_count: src.employee_count || 0,
        company_city: src.company_city || '',
        company_state: src.company_state || '',
        company_country: src.company_country || '',
        industry: src.industry || '',
        organization_linkedin_url: src.company_linkedin_url || src.linkedin_url || '',
        facebook_url: src.facebook_url || '',
        twitter_url: src.twitter_url || '',
        keywords: src.keywords || (Array.isArray(src.organization_keywords) ? src.organization_keywords.join(', ') : src.organization_keywords) || '',
        organization_hq_location_postal_code: src.organization_hq_location_postal_code || src.company_postal_code || src.company_zip || '',
      },
      is_saved: false,
      doc_count: bucket.doc_count,
    };
  });

  const afterKey = esRes.aggregations?.companies?.after_key;
  return {
    results,
    total: results.length,
    nextCursor: afterKey ? JSON.stringify(afterKey) : null,
    hasMore: buckets.length >= size,
  };
}

module.exports = {
  executeSearch,
  executeSearchCount,
  executeCompanySearch,
  buildMongoQuery,
};

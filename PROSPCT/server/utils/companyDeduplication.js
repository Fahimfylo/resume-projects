/**
 * Company Deduplication Utilities
 * Handles messy, real-world company name normalization and deduplication
 */

// Common legal suffixes to strip for better matching
const LEGAL_SUFFIXES = [
  /\s*,?\s*inc\.?$/i,
  /\s*,?\s*llc\.?$/i,
  /\s*,?\s*ltd\.?$/i,
  /\s*,?\s*limited$/i,
  /\s*,?\s*corp\.?$/i,
  /\s*,?\s*corporation$/i,
  /\s*,?\s*co\.?$/i,
  /\s*,?\s*company$/i,
  /\s*,?\s*plc\.?$/i,
  /\s*,?\s*gmbh$/i,
  /\s*,?\s*s\.?a\.?$/i,
  /\s*,?\s*pty\.?\s*ltd\.?$/i,
  /\s*,?\s*holdings?$/i,
  /\s*,?\s*group$/i,
];

// Common location/branch indicators to strip
const BRANCH_INDICATORS = [
  /\s*[-,]?\s*headquarters?$/i,
  /\s*[-,]?\s*hq$/i,
  /\s*[-,]?\s*usa?$/i,
  /\s*[-,]?\s*uk$/i,
  /\s*[-,]?\s*nyc$/i,
  /\s*[-,]?\s*sf$/i,
  /\s*[-,]?\s*london$/i,
  /\s*[-,]?\s*new\s*york$/i,
  /\s*[-,]?\s*california$/i,
  /\s*[-,]?\s*texas$/i,
];

/**
 * Normalize company name for deduplication
 * This is the critical function that reduces false duplicates
 */
function normalizeCompanyName(name) {
  if (!name || typeof name !== "string") return null;

  let normalized = name.trim();

  // Remove invalid values
  if (normalized === "" || normalized.toLowerCase() === "[missing]") {
    return null;
  }

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Remove legal suffixes
  LEGAL_SUFFIXES.forEach((regex) => {
    normalized = normalized.replace(regex, "");
  });

  // Remove branch/location indicators
  BRANCH_INDICATORS.forEach((regex) => {
    normalized = normalized.replace(regex, "");
  });

  // Remove common punctuation and standardize
  normalized = normalized
    .replace(/[.,;:'"()]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/&/g, "and") // Standardize ampersand
    .replace(/\+/g, "plus") // Standardize plus
    .trim();

  // Remove trailing numbers that might be branch codes (e.g., "Google 123")
  normalized = normalized.replace(/\s+\d+$/g, "");

  return normalized.length > 0 ? normalized : null;
}

/**
 * Extract domain from email or website field
 */
function extractDomain(contact) {
  // Check email field
  if (contact.email && typeof contact.email === "string") {
    const match = contact.email.match(/@([^@]+)$/);
    if (match) {
      const domain = match[1].toLowerCase();
      // Skip generic email providers
      const genericDomains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "aol.com",
        "icloud.com",
        "mail.com",
        "live.com",
      ];
      if (!genericDomains.includes(domain)) {
        return domain;
      }
    }
  }

  // Check website field
  if (contact.website && typeof contact.website === "string") {
    try {
      const url = contact.website.toLowerCase();
      const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
      if (match) {
        return match[1].replace(/^www\./, "");
      }
    } catch (e) {
      // Invalid URL, ignore
    }
  }

  return null;
}

/**
 * Generate deduplication key for a contact/company
 * Priority: domain > normalized name
 */
function generateCompanyKey(contact) {
  // Priority 1: Extracted domain from email/website (most reliable)
  const domain = extractDomain(contact);
  if (domain) {
    return { key: `domain:${domain}`, source: "extracted_domain", value: domain };
  }

  // Priority 2: organization_domain field
  if (contact.organization_domain && typeof contact.organization_domain === "string") {
    const orgDomain = contact.organization_domain.toLowerCase().trim();
    if (orgDomain && orgDomain !== "[missing]" && orgDomain.length > 0) {
      return { key: `domain:${orgDomain}`, source: "organization_domain", value: orgDomain };
    }
  }

  // Priority 3: organization_id field
  if (contact.organization_id && typeof contact.organization_id === "string") {
    const orgId = contact.organization_id.trim();
    if (orgId.length > 0) {
      return { key: `id:${orgId}`, source: "organization_id", value: orgId };
    }
  }

  // Priority 4: Normalized organization_name (fallback)
  const normalized = normalizeCompanyName(contact.organization_name);
  if (normalized) {
    return { key: `name:${normalized}`, source: "normalized_name", value: normalized };
  }

  // Priority 5: company_name as last fallback
  const companyNormalized = normalizeCompanyName(contact.company_name);
  if (companyNormalized) {
    return { key: `name:${companyNormalized}`, source: "company_name", value: companyNormalized };
  }

  return null;
}

/**
 * Deduplicate array of companies/contacts
 */
function deduplicateCompanies(contacts) {
  const seen = new Set();
  const duplicates = [];
  const unique = [];

  contacts.forEach((contact) => {
    const keyInfo = generateCompanyKey(contact);

    if (!keyInfo) {
      // No valid key, skip or keep based on requirements
      return;
    }

    if (seen.has(keyInfo.key)) {
      duplicates.push({ contact, key: keyInfo });
    } else {
      seen.add(keyInfo.key);
      unique.push({ contact, key: keyInfo });
    }
  });

  return {
    unique: unique.map((u) => u.contact),
    duplicateCount: duplicates.length,
    uniqueCount: unique.length,
    stats: {
      byDomain: unique.filter((u) => u.key.source.includes("domain")).length,
      byId: unique.filter((u) => u.key.source === "organization_id").length,
      byName: unique.filter((u) => u.key.source.includes("name")).length,
    },
  };
}

/**
 * Get unique companies from Elasticsearch using composite aggregation
 * This handles 60M+ records efficiently
 */
async function getUniqueCompaniesES(esClient, index = "contacts_search", filters = {}) {
  const uniqueKeys = new Map(); // key -> { name, domain, count }
  let afterKey = null;
  let hasMore = true;
  let iterations = 0;
  const MAX_ITERATIONS = 500; // Safety limit

  // Build base query
  const baseQuery = {
    bool: {
      filter: [{ exists: { field: "organization_name" } }],
    },
  };

  // Apply additional filters
  if (filters.industry) {
    baseQuery.bool.filter.push({
      match: { industry: filters.industry },
    });
  }

  if (filters.location) {
    baseQuery.bool.filter.push({
      bool: {
        should: [
          { match: { company_city: filters.location } },
          { match: { company_state: filters.location } },
          { match: { company_country: filters.location } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  // Use composite aggregation to paginate through all unique values
  while (hasMore && iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await esClient.search({
      index,
      size: 0,
      body: {
        query: baseQuery,
        aggs: {
          companies: {
            composite: {
              size: 10000, // Max bucket size per request
              sources: [
                {
                  company_name: {
                    terms: {
                      field: "organization_name.keyword",
                      missing_bucket: true,
                    },
                  },
                },
              ],
              ...(afterKey ? { after: afterKey } : {}),
            },
            aggs: {
              // Get sample domain if available
              sample_domain: {
                top_hits: {
                  size: 1,
                  _source: ["organization_domain", "website", "email"],
                },
              },
              // Count of contacts per company
              contact_count: {
                value_count: {
                  field: "_id",
                },
              },
            },
          },
        },
      },
    });

    const buckets = response.aggregations?.companies?.buckets || [];

    buckets.forEach((bucket) => {
      const rawName = bucket.key?.company_name;
      if (!rawName || rawName === "[missing]") return;

      const normalized = normalizeCompanyName(rawName);
      if (!normalized) return;

      // Check if we've seen this normalized name
      if (!uniqueKeys.has(normalized)) {
        const sample = bucket.sample_domain?.hits?.hits?.[0]?._source || {};
        const domain =
          sample.organization_domain ||
          extractDomain({ website: sample.website, email: sample.email });

        uniqueKeys.set(normalized, {
          name: rawName,
          normalized,
          domain,
          contactCount: bucket.contact_count?.value || 0,
        });
      }
    });

    afterKey = response.aggregations?.companies?.after_key;
    hasMore = !!afterKey && buckets.length === 10000;

    // Log progress every 10 iterations
    if (iterations % 10 === 0) {
    }
  }

  return {
    companies: Array.from(uniqueKeys.values()),
    totalUnique: uniqueKeys.size,
    iterations,
  };
}

module.exports = {
  normalizeCompanyName,
  extractDomain,
  generateCompanyKey,
  deduplicateCompanies,
  getUniqueCompaniesES,
};

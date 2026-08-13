/**
 * Company Deduplication Service
 * 
 * Provides robust deduplication of companies from Elasticsearch contacts data.
 * Handles real-world messy data with multiple fallback identifiers.
 * 
 * @author Senior Backend Engineer
 * @version 1.0.0
 */

const esClient = require("../config/elasticsearch");
const logger = require("../utils/logger");

/**
 * Company Deduplication Service
 */
class CompanyDeduplicationService {
  constructor() {
    this.ES_INDEX = "companies";
    this.DEFAULT_BATCH_SIZE = 1000;
    this.MAX_RESULTS = 10000; // Safety limit for pagination
  }

  /**
   * ============================================================================
   * APPROACH 1: NODE.JS DEDUPLICATION (Recommended for complex logic)
   * ============================================================================
   * 
   * Fetches contacts from Elasticsearch, normalizes and deduplicates using Map.
   * Best for:
   * - Complex deduplication logic with multiple fallback identifiers
   * - When you need full control over the deduplication algorithm
   * - Smaller datasets (< 100k contacts)
   * 
   * @param {Object} options - Search options
   * @param {Object} options.filters - Elasticsearch filters to apply
   * @param {number} options.batchSize - Number of contacts to fetch per batch (default: 1000)
   * @param {number} options.maxResults - Maximum total contacts to process (default: 10000)
   * @returns {Promise<Array>} - Array of unique companies
   */
  async getUniqueCompaniesNodeJs(options = {}) {
    const { filters = {}, batchSize = this.DEFAULT_BATCH_SIZE, maxResults = this.MAX_RESULTS } = options;
    
    logger.info("[CompanyDeduplication] Starting Node.js deduplication approach", {
      filters,
      batchSize,
      maxResults
    });

    const startTime = Date.now();
    const uniqueCompanies = new Map(); // Map<dedupKey, companyObject>
    let processedCount = 0;
    let batchCount = 0;
    let hasMore = true;
    let searchAfter = null;

    try {
      while (hasMore && processedCount < maxResults) {
        batchCount++;
        
        // Build Elasticsearch query with search_after for deep pagination
        const esQuery = this._buildScrollQuery(filters, batchSize, searchAfter);
        
        const response = await esClient.search(esQuery);
        const hits = response.hits.hits;
        
        if (hits.length === 0) {
          hasMore = false;
          break;
        }

        // Process each contact and extract unique companies
        for (const hit of hits) {
          const contact = hit._source;
          const company = this._extractCompanyFromContact(contact);
          
          if (!company) {
            // Skip invalid companies (no valid identifiers)
            continue;
          }

          // Generate unique identifier with priority fallback
          const dedupKey = this._generateDedupKey(company);
          
          if (!dedupKey) {
            // Skip if we can't generate a valid dedup key
            continue;
          }

          // Store in Map (automatically handles duplicates)
          if (!uniqueCompanies.has(dedupKey)) {
            uniqueCompanies.set(dedupKey, company);
          } else {
            // Merge with existing record (keep non-null values)
            const existing = uniqueCompanies.get(dedupKey);
            const merged = this._mergeCompanyRecords(existing, company);
            uniqueCompanies.set(dedupKey, merged);
          }
        }

        processedCount += hits.length;
        
        // Get search_after for next batch
        const lastHit = hits[hits.length - 1];
        searchAfter = lastHit.sort;

        logger.debug(`[CompanyDeduplication] Batch ${batchCount} complete. Processed: ${processedCount}, Unique: ${uniqueCompanies.size}`);

        // Safety check: if we got fewer results than batch size, we're done
        if (hits.length < batchSize) {
          hasMore = false;
        }
      }

      const duration = Date.now() - startTime;
      
      logger.info("[CompanyDeduplication] Node.js deduplication complete", {
        totalContactsProcessed: processedCount,
        uniqueCompanies: uniqueCompanies.size,
        batches: batchCount,
        durationMs: duration
      });

      // Convert Map to array and format output
      const results = Array.from(uniqueCompanies.values()).map(company => ({
        name: company.name || null,
        domain: company.domain || null,
        id: company.id || null,
        website: company.website || null,
        // Additional metadata for debugging/auditing
        _dedupKey: company._dedupKey || null,
        _sourcesCount: company._sourcesCount || 1
      }));

      return {
        companies: results,
        meta: {
          totalContactsProcessed: processedCount,
          uniqueCompaniesCount: results.length,
          batchesProcessed: batchCount,
          durationMs: duration,
          approach: "nodejs"
        }
      };

    } catch (error) {
      logger.error("[CompanyDeduplication] Error in Node.js deduplication", {
        error: error.message,
        stack: error.stack,
        processedCount
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * APPROACH 2: ELASTICSEARCH AGGREGATION (Best for large datasets)
   * ============================================================================
   * 
   * Uses Elasticsearch composite aggregation with script-based grouping.
   * Best for:
   * - Large datasets (100k+ contacts)
   * - When you want ES to handle all the work
   * - Better performance but less flexible deduplication logic
   * 
   * @param {Object} options - Search options
   * @param {Object} options.filters - Elasticsearch filters to apply
   * @param {number} options.maxCompanies - Maximum companies to return (default: 10000)
   * @returns {Promise<Array>} - Array of unique companies
   */
  async getUniqueCompaniesElasticsearch(options = {}) {
    const { filters = {}, maxCompanies = this.MAX_RESULTS } = options;
    
    logger.info("[CompanyDeduplication] Starting Elasticsearch aggregation approach", {
      filters,
      maxCompanies
    });

    const startTime = Date.now();
    const uniqueCompanies = [];
    let afterKey = null;
    let batchCount = 0;
    let hasMore = true;

    try {
      while (hasMore && uniqueCompanies.length < maxCompanies) {
        batchCount++;

        const esQuery = this._buildCompositeAggregationQuery(filters, afterKey);
        
        const response = await esClient.search(esQuery);
        const buckets = response.aggregations?.unique_companies?.buckets || [];
        
        if (buckets.length === 0) {
          hasMore = false;
          break;
        }

        // Process each bucket (represents one unique company)
        for (const bucket of buckets) {
          const company = this._parseAggregationBucket(bucket);
          if (company) {
            uniqueCompanies.push(company);
          }
        }

        // Get after_key for next pagination
        afterKey = response.aggregations?.unique_companies?.after_key;
        
        if (!afterKey || buckets.length < 100) {
          hasMore = false;
        }

        logger.debug(`[CompanyDeduplication] ES Batch ${batchCount} complete. Companies: ${uniqueCompanies.length}`);
      }

      const duration = Date.now() - startTime;
      
      logger.info("[CompanyDeduplication] Elasticsearch aggregation complete", {
        uniqueCompanies: uniqueCompanies.length,
        batches: batchCount,
        durationMs: duration
      });

      return {
        companies: uniqueCompanies,
        meta: {
          uniqueCompaniesCount: uniqueCompanies.length,
          batchesProcessed: batchCount,
          durationMs: duration,
          approach: "elasticsearch"
        }
      };

    } catch (error) {
      logger.error("[CompanyDeduplication] Error in Elasticsearch aggregation", {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * HYBRID APPROACH (Best of both worlds)
   * ============================================================================
   * 
   * Uses ES aggregation for initial deduplication, then Node.js for refinement.
   * Handles edge cases that pure ES aggregation might miss.
   * 
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of unique companies
   */
  async getUniqueCompaniesHybrid(options = {}) {
    logger.info("[CompanyDeduplication] Starting hybrid approach");

    // First pass: Get candidates using ES aggregation
    const esResults = await this.getUniqueCompaniesElasticsearch({
      ...options,
      maxCompanies: 5000 // Limit initial candidates
    });

    // Second pass: Refine with Node.js logic for complex deduplication
    const nodeJsResults = await this.getUniqueCompaniesNodeJs({
      ...options,
      maxResults: 5000
    });

    // Merge and deduplicate both results
    const combined = new Map();
    
    // Add ES results
    for (const company of esResults.companies) {
      const key = this._generateDedupKey(company);
      if (key && !combined.has(key)) {
        combined.set(key, { ...company, _source: "elasticsearch" });
      }
    }
    
    // Add/merge Node.js results
    for (const company of nodeJsResults.companies) {
      const key = this._generateDedupKey(company);
      if (!key) continue;
      
      if (combined.has(key)) {
        const existing = combined.get(key);
        combined.set(key, this._mergeCompanyRecords(existing, company));
      } else {
        combined.set(key, { ...company, _source: "nodejs" });
      }
    }

    const results = Array.from(combined.values());
    
    logger.info("[CompanyDeduplication] Hybrid approach complete", {
      esCandidates: esResults.companies.length,
      nodeJsCandidates: nodeJsResults.companies.length,
      finalUnique: results.length
    });

    return {
      companies: results.map(c => ({
        name: c.name,
        domain: c.domain,
        id: c.id,
        website: c.website
      })),
      meta: {
        uniqueCompaniesCount: results.length,
        esCandidates: esResults.companies.length,
        nodeJsCandidates: nodeJsResults.companies.length,
        approach: "hybrid"
      }
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Extract company information from a contact document
   * 
   * @param {Object} contact - Elasticsearch contact document
   * @returns {Object|null} - Company object or null if invalid
   * @private
   */
  _extractCompanyFromContact(contact) {
    if (!contact || typeof contact !== "object") {
      return null;
    }

    // Extract fields with safe defaults (prefer organization_* over company_*)
    const company = {
      name: this._sanitizeString(contact.organization_name) || this._sanitizeString(contact.company_name),
      domain: this._sanitizeString(contact.organization_domain) || this._sanitizeString(contact.company_domain),
      id: this._sanitizeString(contact.organization_id),
      website: this._sanitizeString(contact.organization_website_url),
      sanitizedName: this._sanitizeString(contact.sanitized_organization_name_unanalyzed),
      _raw: contact // Keep raw for debugging
    };

    // Validate: Must have at least one valid identifier
    if (!this._hasValidIdentifier(company)) {
      return null;
    }

    return company;
  }

  /**
   * Check if company has at least one valid identifier
   * 
   * @param {Object} company - Company object
   * @returns {boolean}
   * @private
   */
  _hasValidIdentifier(company) {
    // Must have a name at minimum
    if (!company.name) {
      return false;
    }

    // Must have at least one identifier field
    return !!(
      company.id || 
      company.domain || 
      company.sanitizedName || 
      company.name
    );
  }

  /**
   * Generate unique deduplication key with priority fallback
   * 
   * Priority (highest to lowest):
   * 1. organization_id
   * 2. organization_domain
   * 3. sanitized_organization_name_unanalyzed
   * 4. organization_name (normalized: lowercase + trimmed)
   * 
   * @param {Object} company - Company object
   * @returns {string|null} - Dedup key or null if invalid
   * @private
   */
  _generateDedupKey(company) {
    if (!company) return null;

    // Priority 1: organization_id (highest priority - most reliable)
    if (company.id) {
      return `id:${company.id.toLowerCase().trim()}`;
    }

    // Priority 2: organization_domain
    if (company.domain) {
      const normalizedDomain = company.domain.toLowerCase().trim()
        .replace(/^https?:\/\//, "")  // Remove protocol
        .replace(/^www\./, "")         // Remove www
        .replace(/\/+$/, "");          // Remove trailing slashes
      return `domain:${normalizedDomain}`;
    }

    // Priority 3: sanitized_organization_name_unanalyzed
    if (company.sanitizedName) {
      return `sanitized:${company.sanitizedName.toLowerCase().trim()}`;
    }

    // Priority 4: organization_name (normalized)
    if (company.name) {
      const normalized = company.name.toLowerCase().trim()
        .replace(/[^a-z0-9]/g, ""); // Remove special chars for better matching
      return `name:${normalized}`;
    }

    return null;
  }

  /**
   * Merge two company records, keeping best available data
   * 
   * @param {Object} existing - Existing company record
   * @param {Object} incoming - New company record
   * @returns {Object} - Merged company record
   * @private
   */
  _mergeCompanyRecords(existing, incoming) {
    return {
      name: existing.name || incoming.name || null,
      domain: existing.domain || incoming.domain || null,
      id: existing.id || incoming.id || null,
      website: existing.website || incoming.website || null,
      sanitizedName: existing.sanitizedName || incoming.sanitizedName || null,
      _sourcesCount: (existing._sourcesCount || 1) + 1,
      _dedupKey: existing._dedupKey || incoming._dedupKey
    };
  }

  /**
   * Sanitize string value
   * 
   * @param {*} value - Any value
   * @returns {string|null} - Sanitized string or null
   * @private
   */
  _sanitizeString(value) {
    if (value === null || value === undefined) {
      return null;
    }
    
    if (typeof value !== "string") {
      return String(value).trim() || null;
    }
    
    const trimmed = value.trim();
    return trimmed || null;
  }

  /**
   * Build Elasticsearch scroll query with search_after
   * 
   * @param {Object} filters - User filters
   * @param {number} batchSize - Batch size
   * @param {Array} searchAfter - Search after values
   * @returns {Object} - ES query
   * @private
   */
  _buildScrollQuery(filters, batchSize, searchAfter) {
    const query = {
      index: this.ES_INDEX,
      size: batchSize,
      _source: [
        "organization_name",
        "organization_domain",
        "company_name",
        "company_domain",
        "organization_id",
        "organization_website_url",
        "sanitized_organization_name_unanalyzed"
      ],
      sort: [
        { "_doc": "asc" }
      ],
      query: {
        bool: {
          must: [
            {
              bool: {
                should: [
                  { exists: { field: "organization_domain" } },
                  { exists: { field: "organization_name" } },
                  { exists: { field: "company_name" } },
                  { exists: { field: "company_domain" } }
                ],
                minimum_should_match: 1
              }
            }
          ]
        }
      }
    };

    // Apply additional user filters
    if (Object.keys(filters).length > 0) {
      const filterClauses = this._buildFilterClauses(filters);
      if (filterClauses.length > 0) {
        query.query.bool.filter = filterClauses;
      }
    }

    // Add search_after for pagination
    if (searchAfter) {
      query.search_after = searchAfter;
    }

    return query;
  }

  /**
   * Build Elasticsearch composite aggregation query
   * 
   * @param {Object} filters - User filters
   * @param {Object} afterKey - After key for pagination
   * @returns {Object} - ES query
   * @private
   */
  _buildCompositeAggregationQuery(filters, afterKey) {
    const query = {
      index: this.ES_INDEX,
      size: 0,
      query: {
        bool: {
          must: [
            {
              bool: {
                should: [
                  { exists: { field: "organization_id" } },
                  { exists: { field: "organization_domain" } },
                  { exists: { field: "organization_name" } },
                  { exists: { field: "company_name" } },
                  { exists: { field: "company_domain" } }
                ],
                minimum_should_match: 1
              }
            }
          ],
          must_not: [
            {
              bool: {
                must_not: [
                  { exists: { field: "organization_name" } }
                ]
              }
            }
          ]
        }
      },
      aggs: {
        unique_companies: {
          composite: {
            size: 100,
            sources: [
              {
                by_id: {
                  terms: {
                    field: "organization_id",
                    missing_bucket: true
                  }
                }
              },
              {
                by_domain: {
                  terms: {
                    field: "organization_domain.keyword",
                    missing_bucket: true
                  }
                }
              },
              {
                by_name: {
                  terms: {
                    field: "organization_name.keyword",
                    missing_bucket: true
                  }
                }
              }
            ]
          },
          aggs: {
            top_hit: {
              top_hits: {
                size: 1,
                _source: [
                  "organization_name",
                  "organization_domain",
                  "company_name",
                  "company_domain",
                  "organization_id",
                  "organization_website_url"
                ]
              }
            },
            doc_count: {
              value_count: {
                field: "_index"
              }
            }
          }
        }
      }
    };

    // Apply additional filters
    if (Object.keys(filters).length > 0) {
      const filterClauses = this._buildFilterClauses(filters);
      query.query.bool.filter = filterClauses;
    }

    // Add after key for pagination
    if (afterKey) {
      query.aggs.unique_companies.composite.after = afterKey;
    }

    return query;
  }

  /**
   * Parse aggregation bucket into company object
   * 
   * @param {Object} bucket - ES aggregation bucket
   * @returns {Object|null} - Company object or null
   * @private
   */
  _parseAggregationBucket(bucket) {
    if (!bucket) return null;

    const hit = bucket.top_hit?.hits?.hits?.[0]?._source;
    if (!hit) return null;

    const company = {
      name: hit.organization_name || hit.company_name || null,
      domain: hit.organization_domain || hit.company_domain || null,
      id: hit.organization_id || null,
      website: hit.organization_website_url || null,
      _contactCount: bucket.doc_count?.value || 0
    };

    // Skip if no valid name
    if (!company.name) return null;

    return company;
  }

  /**
   * ============================================================================
   * GET UNIQUE COMPANY COUNTS (For Filter Display)
   * ============================================================================
   * 
   * Returns counts of unique companies (not contacts) for the filter tabs.
   * This is the key method to fix the "showing total database amount" issue.
   * 
   * @param {Object} options - Search options
   * @param {Object} options.filters - Elasticsearch filters to apply
   * @param {number} options.maxResults - Maximum contacts to scan (default: 50000)
   * @returns {Promise<Object>} - Counts object { total, saved, new }
   */
  async getUniqueCompanyCounts(options = {}) {
    const { filters = {}, maxResults = 50000, userId } = options;

    logger.info("[CompanyDeduplication] Getting unique company counts", { filters, userId });

    const startTime = Date.now();
    const uniqueCompanyIds = new Set(); // Set of dedup keys
    const savedCompanyIds = new Set(); // Set of saved company dedup keys
    let domainMap = new Map(); // Set of normalized domains to dedup keys
    let processedCount = 0;
    let hasMore = true;
    let searchAfter = null;

    // ── Phase 1: Get saved contact IDs for the user ──────────────────────────
    let savedContactIds = new Set();
    if (userId) {
      const SavedItem = require("../models/SavedItem");
      const SavedContacts = require("../models/SavedContacts");

      try {
        const [savedItemDocs, savedContactsDocs] = await Promise.all([
          SavedItem.find({ userId }).select("contactId").lean(),
          SavedContacts.find({ userId }).select("contactId").lean(),
        ]);
        savedContactIds = new Set([
          ...savedItemDocs.map((item) => String(item.contactId)),
          ...savedContactsDocs.map((item) => String(item.contactId)),
        ]);
        logger.info("[CompanyDeduplication] Found saved contacts", { count: savedContactIds.size });
      } catch (error) {
        logger.error("[CompanyDeduplication] Error fetching saved contacts", error);
      }
    }

    try {
      while (hasMore && processedCount < maxResults) {
        // Build Elasticsearch query with search_after for deep pagination
        const esQuery = this._buildScrollQuery(filters, 2000, searchAfter);
        
        
        let response;
        try {
          response = await esClient.search(esQuery);
        } catch (esError) {
          console.error("[CompanyDeduplication] Elasticsearch error:", esError.message);
          console.error("[CompanyDeduplication] ES Error details:", esError.meta?.body?.error);
          throw esError;
        }
        const hits = response.hits.hits;
        
        if (hits.length === 0) {
          hasMore = false;
          break;
        }

          // Extract unique company identifiers
          for (const hit of hits) {
            const contact = hit._source;
            
            // Skip if the contact lacks any identifier (id, name, domain)
            if (!contact.organization_id && !contact.organization_name && !contact.organization_domain && !contact.company_name && !contact.company_domain) {
              continue;
            }

            const company = {
              name: this._sanitizeString(contact.organization_name) || this._sanitizeString(contact.company_name),
              domain: this._sanitizeString(contact.organization_domain) || this._sanitizeString(contact.company_domain),
              id: this._sanitizeString(contact.organization_id),
            };

            const dedupKey = this._generateDedupKey(company);
            if (!dedupKey) continue;

            // Normalize domain for duplicate detection
            const normalizedDomain = company.domain ? company.domain.toLowerCase().trim()
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "")
              .replace(/\/+$/, "") : null;

            // If domain already seen, treat as duplicate
            if (normalizedDomain && domainMap.has(normalizedDomain)) {
              continue;
            }

            if (uniqueCompanyIds.has(dedupKey)) {
              if (normalizedDomain) domainMap.set(normalizedDomain, dedupKey);
              continue;
            }

            // Track if this company is saved (contact has is_saved flag)
            const isSaved = Boolean(contact.is_saved);
            if (isSaved) {
              savedCompanyIds.add(dedupKey);
            }

            uniqueCompanyIds.add(dedupKey);
            if (normalizedDomain) domainMap.set(normalizedDomain, dedupKey);
          }

        processedCount += hits.length;
        
        // Get search_after for next batch
        const lastHit = hits[hits.length - 1];
        searchAfter = lastHit.sort;

        // Safety check
        if (hits.length < 2000) {
          hasMore = false;
        }
      }

      const duration = Date.now() - startTime;
      const uniqueCount = uniqueCompanyIds.size;
      const savedCount = savedCompanyIds.size;
      const newCount = uniqueCount - savedCount;
      
      
      logger.info("[CompanyDeduplication] Company counts complete", {
        totalContactsProcessed: processedCount,
        uniqueCompanies: uniqueCount,
        savedCompanies: savedCount,
        newCompanies: newCount,
        durationMs: duration
      });

      // Return counts in the format expected by the frontend
      return {
        total: uniqueCount,
        saved: savedCount,
        new: newCount,
        meta: {
          totalContactsProcessed: processedCount,
          uniqueCompaniesCount: uniqueCount,
          savedCompaniesCount: savedCount,
          newCompaniesCount: newCount,
          durationMs: duration
        }
      };

    } catch (error) {
      logger.error("[CompanyDeduplication] Error getting company counts", {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * ============================================================================
   * GET FILTERED COMPANIES (For Pagination)
   * ============================================================================
   * 
   * Returns paginated unique companies with total count for pagination.
   * This method is called by the /companies endpoint.
   * 
   * @param {Object} options - Search options
   * @param {Object} options.filters - Elasticsearch filters to apply
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} - Paginated results { companies, total, page, totalPages }
   */
  async getFilteredCompanies(options = {}) {
    const { filters = {}, page = 1, limit = 25 } = options;
    
    logger.info("[CompanyDeduplication] Getting filtered companies", { filters, page, limit });

    const startTime = Date.now();
    
    try {
      // First, get the total count of unique companies
      const countResult = await this.getUniqueCompanyCounts({
        filters,
        maxResults: 50000
      });
      
      const total = countResult.total;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      
      // Then get the paginated companies using Node.js approach
      const companiesResult = await this.getUniqueCompaniesNodeJs({
        filters,
        maxResults: offset + limit // Fetch enough to cover all pages up to current
      });
      
      // Extract only the companies for the current page
      const companies = companiesResult.companies.slice(offset, offset + limit);
      
      const duration = Date.now() - startTime;
      
      logger.info("[CompanyDeduplication] Filtered companies complete", {
        total,
        page,
        limit,
        totalPages,
        returnedCompanies: companies.length,
        durationMs: duration
      });

      return {
        companies,
        total,
        page: parseInt(page, 10),
        totalPages
      };

    } catch (error) {
      logger.error("[CompanyDeduplication] Error getting filtered companies", {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Build filter clauses from user filters
   * 
   * @param {Object} filters - User filters
   * @returns {Array} - Array of Elasticsearch filter clauses
   * @private
   */
  _buildFilterClauses(filters) {
    const filterClauses = [];
    
    for (const [field, value] of Object.entries(filters)) {
      if (!value && value !== false) continue;
      
      // Handle special hasCompany filter
      if (field === 'hasCompany') {
        if (value === true || value === 'true') {
          filterClauses.push({
            bool: {
              should: [
                { exists: { field: "organization_id" } },
                { exists: { field: "organization_domain" } },
                { exists: { field: "organization_name" } },
                { exists: { field: "company_name" } },
                { exists: { field: "company_domain" } }
              ],
              minimum_should_match: 1
            }
          });
        }
        continue;
      }
      
      // Handle array values (from search API)
      if (Array.isArray(value) && value.length > 0) {
        const esField = this._mapFilterField(field);
        if (esField) {
          filterClauses.push({
            terms: { [esField]: value }
          });
        }
      } 
      // Handle string values
      else if (typeof value === 'string' && value.trim()) {
        // Map field names to Elasticsearch field names
        const esField = this._mapFilterField(field);
        if (esField) {
          filterClauses.push({
            term: { [esField]: value.trim() }
          });
        }
      }
      // Handle boolean values
      else if (typeof value === 'boolean') {
        const esField = this._mapFilterField(field);
        if (esField) {
          filterClauses.push({
            term: { [esField]: value }
          });
        }
      }
    }
    
    return filterClauses;
  }

  /**
   * Map filter field names to Elasticsearch field names
   * 
   * @param {string} field - Filter field name
   * @returns {string|null} - Elasticsearch field name or null
   * @private
   */
  _mapFilterField(field) {
    const fieldMapping = {
      'organizationName': 'organization_name.keyword',
      'organization_domain': 'organization_domain.keyword',
      'organization_name': 'organization_name.keyword',
      'company_name': 'company_name.keyword',
      'company_domain': 'company_domain.keyword',
      'location': 'location.keyword',
      'industry': 'industry.keyword',
      'employeeRange': 'employee_range.keyword',
      'employees': 'employee_range.keyword',
      'keywords': 'keywords.keyword',
      'hasCompany': '_exists', // Special handling
    };
    
    return fieldMapping[field] || field;
  }

} // Added missing closing brace for CompanyDeduplicationService class

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

const companyDeduplicationService = new CompanyDeduplicationService();

module.exports = companyDeduplicationService;

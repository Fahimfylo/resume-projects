/**
 * Company Controller
 * 
 * Handles API endpoints for company-related operations including
 * deduplication and company discovery from contacts data.
 * 
 * @author Senior Backend Engineer
 * @version 1.0.0
 */

const mongoose = require("mongoose");
const companyDeduplicationService = require("../services/companyDeduplicationService");
const esClient = require("../config/elasticsearch");
const logger = require("../utils/logger");

/**
 * Company Controller
 */
const companyController = {
  /**
   * ============================================================================
   * GET UNIQUE COMPANIES (Primary Endpoint)
   * ============================================================================
   * 
   * GET /api/companies/unique
   * 
   * Returns a deduplicated list of unique companies from the contacts dataset.
   * 
   * Query Parameters:
   * - approach: "nodejs" | "elasticsearch" | "hybrid" (default: "nodejs")
   * - limit: Maximum number of companies to return (default: 1000)
   * - batchSize: Batch size for Node.js approach (default: 1000)
   * 
   * Example Response:
   * {
   *   "success": true,
   *   "data": [
   *     { "name": "Sysco", "domain": "sysco.com", "id": "57cf8a48a6da984c4213ccbc" },
   *     ...
   *   ],
   *   "meta": {
   *     "uniqueCompaniesCount": 150,
   *     "totalContactsProcessed": 10000,
   *     "durationMs": 1250,
   *     "approach": "nodejs"
   *   }
   * }
   */
  getUniqueCompanies: async (req, res) => {
    try {
      const {
        approach = "nodejs",
        limit = 1000,
        batchSize = 1000,
        ...filters
      } = req.query;

      // Validate approach
      const validApproaches = ["nodejs", "elasticsearch", "hybrid"];
      if (!validApproaches.includes(approach)) {
        return res.status(400).json({
          success: false,
          error: `Invalid approach. Must be one of: ${validApproaches.join(", ")}`
        });
      }

      // Parse numeric parameters
      const maxLimit = parseInt(limit, 10);
      const maxBatchSize = parseInt(batchSize, 10);

      if (isNaN(maxLimit) || maxLimit < 1 || maxLimit > 50000) {
        return res.status(400).json({
          success: false,
          error: "Invalid limit. Must be between 1 and 50000"
        });
      }

      logger.info("[CompanyController] Get unique companies request", {
        approach,
        limit: maxLimit,
        batchSize: maxBatchSize,
        filters
      });

      let result;

      // Execute based on chosen approach
      switch (approach) {
        case "elasticsearch":
          result = await companyDeduplicationService.getUniqueCompaniesElasticsearch({
            filters,
            maxCompanies: maxLimit
          });
          break;

        case "hybrid":
          result = await companyDeduplicationService.getUniqueCompaniesHybrid({
            filters,
            maxCompanies: maxLimit
          });
          break;

        case "nodejs":
        default:
          result = await companyDeduplicationService.getUniqueCompaniesNodeJs({
            filters,
            batchSize: maxBatchSize,
            maxResults: maxLimit * 10 // Process more contacts to get enough unique companies
          });
          break;
      }

      // Format response
      const response = {
        success: true,
        data: result.companies,
        meta: {
          ...result.meta,
          requestParams: {
            approach,
            limit: maxLimit,
            batchSize: maxBatchSize
          }
        }
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error("[CompanyController] Error getting unique companies", {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: "Failed to retrieve unique companies",
        message: error.message
      });
    }
  },

  /**
   * ============================================================================
   * SEARCH COMPANIES
   * ============================================================================
   * 
   * GET /api/companies/search
   * 
   * Search for companies by name or domain with deduplication.
   * 
   * Query Parameters:
   * - q: Search query (required)
   * - field: "name" | "domain" | "all" (default: "all")
   * - limit: Maximum results (default: 50)
   */
  searchCompanies: async (req, res) => {
    try {
      const {
        q: query,
        field = "all",
        limit = 50
      } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Query must be at least 2 characters"
        });
      }

      // Build filters based on search field
      const filters = {};
      const searchTerm = query.trim();

      if (field === "name" || field === "all") {
        filters.organization_name = searchTerm;
      }
      if (field === "domain" || field === "all") {
        filters.organization_domain = searchTerm;
      }

      logger.info("[CompanyController] Search companies request", {
        query: searchTerm,
        field,
        limit
      });

      // Use Node.js approach for better search flexibility
      const result = await companyDeduplicationService.getUniqueCompaniesNodeJs({
        filters,
        maxResults: parseInt(limit, 10) * 10
      });

      // Filter results client-side for fuzzy matching
      const searchLower = searchTerm.toLowerCase();
      const filteredCompanies = result.companies.filter(company => {
        const nameMatch = company.name?.toLowerCase().includes(searchLower);
        const domainMatch = company.domain?.toLowerCase().includes(searchLower);
        return nameMatch || domainMatch;
      }).slice(0, parseInt(limit, 10));

      res.status(200).json({
        success: true,
        data: filteredCompanies,
        meta: {
          totalFound: filteredCompanies.length,
          searchTerm,
          field
        }
      });

    } catch (error) {
      logger.error("[CompanyController] Error searching companies", {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: "Failed to search companies",
        message: error.message
      });
    }
  },

  /**
   * ============================================================================
   * GET COMPANY COUNTS (For Filter Tabs)
   * ============================================================================
   * 
   * GET /api/companies/counts
   * 
   * Returns counts of UNIQUE companies (not contacts) for the filter display.
   * This fixes the issue where the filter was showing total database contacts
   * instead of unique company count.
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "total": 15000,  // Unique companies, not contacts
   *     "saved": 0,
   *     "new": 15000
   *   }
   * }
   */
  getCompanyCounts: async (req, res) => {
    try {
      const { company, location, industry, employees, keywords } = req.query;

      const CompaniesCache = require("../models/CompaniesCache");

      // Build MongoDB filter conditions matching the companies_cache schema
      const conditions = [];

      if (company && typeof company === "string" && company.trim()) {
        const prefix = company.trim().toLowerCase();
        conditions.push({
          $or: [
            { sanitized_organization_name_unanalyzed: { $gte: prefix, $lt: prefix + '\uffff' } },
            { organization_name: { $gte: prefix, $lt: prefix + '\uffff' } },
          ]
        });
      }

      if (location && typeof location === "string" && location.trim()) {
        const prefix = location.trim().toLowerCase();
        conditions.push({
          $or: [
            { organization_hq_location_city: { $gte: prefix, $lt: prefix + '\uffff' } },
            { organization_hq_location_state: { $gte: prefix, $lt: prefix + '\uffff' } },
          ]
        });
      }

      if (industry && typeof industry === "string" && industry.trim()) {
        const prefix = industry.trim().toLowerCase();
        conditions.push({
          organization_industries: { $gte: prefix, $lt: prefix + '\uffff' }
        });
      }

      if (employees && typeof employees === "string" && employees.trim()) {
        const range = employees.trim();
        const cond = {};
        if (/andmore/i.test(range) || range.endsWith('+')) {
          const num = parseInt(range.replace(/andmore/i, '').replace(/\+$/, ''), 10);
          if (!isNaN(num)) cond.$gte = num;
        } else if (range.includes('-')) {
          const parts = range.split('-').filter(Boolean);
          if (parts.length === 2) {
            const mn = parseInt(parts[0], 10);
            const mx = parseInt(parts[1], 10);
            if (!isNaN(mn)) cond.$gte = mn;
            if (!isNaN(mx)) cond.$lte = mx;
          }
        }
        if (Object.keys(cond).length) {
          conditions.push({ organization_num_current_employees: cond });
        }
      }

      if (keywords && typeof keywords === "string" && keywords.trim()) {
        const prefix = keywords.trim().toLowerCase();
        conditions.push({
          organization_relevant_keywords: { $gte: prefix, $lt: prefix + '\uffff' }
        });
      }

      const query = conditions.length > 0 ? { $and: conditions } : {};

      // Total unique companies from the deduplicated CompaniesCache
      const total = await CompaniesCache.countDocuments(query);

      // Saved count — lookup SavedCompanies collection
      const SavedCompanies = require("../models/SavedCompanies");
      const savedDocs = await SavedCompanies.find({ userId: req.workspaceOwner }).select("companyData").lean();
      // Deduplicate saved companies by normalized name
      const savedCompanyNames = new Set();
      for (const doc of savedDocs) {
        const raw = doc.companyData || {};
        const src = raw._source || raw;
        const name = src.sanitized_organization_name_unanalyzed || src.organization_name || raw.organization_name;
        if (name) savedCompanyNames.add(String(name).toLowerCase().trim());
      }
      let saved = 0;
      if (savedCompanyNames.size > 0) {
        saved = await CompaniesCache.countDocuments({
          ...query,
          sanitized_organization_name_unanalyzed: { $in: [...savedCompanyNames] }
        });
      }

      res.status(200).json({
        success: true,
        data: { total, saved, new: Math.max(0, total - saved) },
        meta: {
          companiesCacheDocCount: total,
          savedCompaniesCount: saved
        }
      });

    } catch (error) {
      console.error("[CompanyController] Error getting company counts:", error);
      console.error("[CompanyController] Error stack:", error.stack);
      logger.error("[CompanyController] Error getting company counts", {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: "Failed to get company counts",
        message: error.message,
        details: error.meta?.body?.error || null
      });
    }
  },

  /**
   * ============================================================================
   * GET COMPANY STATS
   * ============================================================================
   * 
   * GET /api/companies/stats
   * 
   * Returns statistics about companies in the dataset.
   */
  getCompanyStats: async (req, res) => {
    try {
      logger.info("[CompanyController] Get company stats request");

      // Get sample of companies for analysis
      const result = await companyDeduplicationService.getUniqueCompaniesNodeJs({
        batchSize: 500,
        maxResults: 5000
      });

      const companies = result.companies;

      // Calculate stats
      const stats = {
        totalUniqueCompanies: companies.length,
        withDomain: companies.filter(c => c.domain).length,
        withId: companies.filter(c => c.id).length,
        withWebsite: companies.filter(c => c.website).length,
        topLevelDomains: this._extractTopLevelDomains(companies),
        nameLengthDistribution: this._calculateNameLengthDistribution(companies)
      };

      res.status(200).json({
        success: true,
        data: stats,
        meta: {
          sampleSize: companies.length,
          durationMs: result.meta.durationMs
        }
      });

    } catch (error) {
      logger.error("[CompanyController] Error getting company stats", {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: "Failed to get company stats",
        message: error.message
      });
    }
  },

  /**
   * ============================================================================
   * GET COMPANY BY ID
   * ============================================================================
   * 
   * GET /api/companies/:id
   * 
   * Get detailed information about a specific company.
   */
  getCompanyById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Company ID is required"
        });
      }

      logger.info("[CompanyController] Get company by ID request", { id });

      // Search by organization_id
      const result = await companyDeduplicationService.getUniqueCompaniesNodeJs({
        filters: { organization_id: id },
        maxResults: 100
      });

      if (result.companies.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Company not found"
        });
      }

      res.status(200).json({
        success: true,
        data: result.companies[0]
      });

    } catch (error) {
      logger.error("[CompanyController] Error getting company by ID", {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: "Failed to get company",
        message: error.message
      });
    }
  },

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Extract top-level domain distribution
   * @private
   */
  _extractTopLevelDomains(companies) {
    const tldCounts = {};
    
    for (const company of companies) {
      if (!company.domain) continue;
      
      const parts = company.domain.split(".");
      const tld = parts.length > 1 ? parts[parts.length - 1] : "unknown";
      
      tldCounts[tld] = (tldCounts[tld] || 0) + 1;
    }

    // Sort by count and return top 10
    return Object.entries(tldCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tld, count]) => ({ tld, count }));
  },

  /**
   * Calculate name length distribution
   * @private
   */
  _calculateNameLengthDistribution(companies) {
    const ranges = {
      "1-10": 0,
      "11-20": 0,
      "21-30": 0,
      "31-50": 0,
      "50+": 0
    };

    for (const company of companies) {
      if (!company.name) continue;
      
      const length = company.name.length;
      
      if (length <= 10) ranges["1-10"]++;
      else if (length <= 20) ranges["11-20"]++;
      else if (length <= 30) ranges["21-30"]++;
      else if (length <= 50) ranges["31-50"]++;
      else ranges["50+"]++;
    }

    return ranges;
  }
};

module.exports = companyController;

const contacts_v5 = require("../models/Contacts");

const SharedSearch = require("../models/SharedSearch");

const SavedItem = require("../models/SavedItem");

const SavedContacts = require("../models/SavedContacts");

const esClient = require("../config/elasticsearch");

const { executeSearch, executeSearchCount, executeCompanySearch } = require("../services/searchService");

const { exportContactsToCsv } = require("../services/exportService");

// Helper: Get exact unique companies count using composite aggregation
async function getExactUniqueCompaniesCount(esClient, baseQuery) {
  const uniqueDomains = new Set();
  const uniqueIds = new Set();
  const uniqueNames = new Set();
  let afterKey = null;
  let hasMore = true;
  let iterations = 0;
  const MAX_ITERATIONS = 100;

  while (hasMore && iterations < MAX_ITERATIONS) {
    iterations++;
    const response = await esClient.search({
      index: "contacts_search",
      size: 0,
      body: {
        query: {
          bool: {
            must: [
              baseQuery,
              { exists: { field: "organization_domain" } }
            ]
          }
        },
        aggs: {
          companies: {
            composite: {
              size: 100000,
              sources: [
                { domain: { terms: { field: "organization_domain.keyword", missing_bucket: true } } }
              ],
              ...(afterKey ? { after: afterKey } : {})
            }
          }
        }
      }
    });

    const buckets = response.aggregations?.companies?.buckets || [];
    buckets.forEach(bucket => {
      const domain = bucket.key?.domain;
      if (domain && domain !== "[missing]" && domain.length > 0) {
        uniqueDomains.add(domain.toLowerCase());
      }
    });

    afterKey = response.aggregations?.companies?.after_key;
    hasMore = !!afterKey && buckets.length === 100000;
  }

  afterKey = null;
  hasMore = true;
  iterations = 0;

  while (hasMore && iterations < MAX_ITERATIONS) {
    iterations++;
    const response = await esClient.search({
      index: "contacts_search",
      size: 0,
      body: {
        query: {
          bool: {
            must: [
              baseQuery,
              { exists: { field: "organization_id" } },
              { bool: { must_not: { exists: { field: "organization_domain" } } } }
            ]
          }
        },
        aggs: {
          companies: {
            composite: {
              size: 100000,
              sources: [
                { id: { terms: { field: "organization_id.keyword", missing_bucket: true } } }
              ],
              ...(afterKey ? { after: afterKey } : {})
            }
          }
        }
      }
    });

    const buckets = response.aggregations?.companies?.buckets || [];
    buckets.forEach(bucket => {
      const id = bucket.key?.id;
      if (id && id.length > 0) {
        uniqueIds.add(id);
      }
    });

    afterKey = response.aggregations?.companies?.after_key;
    hasMore = !!afterKey && buckets.length === 100000;
  }

  afterKey = null;
  hasMore = true;
  iterations = 0;

  while (hasMore && iterations < MAX_ITERATIONS) {
    iterations++;
    const response = await esClient.search({
      index: "contacts_search",
      size: 0,
      body: {
        query: {
          bool: {
            must: [
              baseQuery,
              { exists: { field: "organization_name" } },
              { bool: { must_not: [{ exists: { field: "organization_domain" } }, { exists: { field: "organization_id" } }] } }
            ]
          }
        },
        aggs: {
          companies: {
            composite: {
              size: 100000,
              sources: [
                { name: { terms: { field: "organization_name", missing_bucket: true } } }
              ],
              ...(afterKey ? { after: afterKey } : {})
            }
          }
        }
      }
    });

    const buckets = response.aggregations?.companies?.buckets || [];
    buckets.forEach(bucket => {
      const name = bucket.key?.name;
      if (name && name !== "[missing]" && name.toLowerCase() !== "[missing]" && name.length > 0) {
        uniqueNames.add(name.toLowerCase().trim());
      }
    });

    afterKey = response.aggregations?.companies?.after_key;
    hasMore = !!afterKey && buckets.length === 100000;
  }

  return uniqueDomains.size + uniqueIds.size + uniqueNames.size;
}

const searchController = {

  // --- Main search ---

  search: async (req, res) => {

    try {

      const userId = req.workspaceOwner;

      const { filters = {}, excludedFilters = {} } = req.body;

      // Feature access check: validate filters against user's plan limits
      const User = require("../models/User");
      const Plan = require("../models/Plans");
      const CustomPlan = require("../models/CustomPlan");
      const user = await User.findById(userId).select("limits plan planType");
      let userLimits = user?.limits || {};
      if (!Object.values(userLimits).some(Boolean) && user?.plan) {
        const PlanModel = user.planType === "custom" ? CustomPlan : Plan;
        const plan = await PlanModel.findById(user.plan).select("features.limits");
        userLimits = plan?.features?.limits || {};
      };
      const filterFeatureMap = {
        technologies: "technologyFilter",
        revenueRange: "revenueFilter",
        revenueThousands: "revenueFilter",
      };
      const usedFilters = Object.keys(filters).filter((key) => {
        const val = filters[key];
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "string") return val.trim() !== "";
        return val != null;
      });
      const blockedFilters = usedFilters.filter(
        (key) => filterFeatureMap[key] && !userLimits[filterFeatureMap[key]],
      );
      if (blockedFilters.length > 0) {
        const missingFeatures = [...new Set(blockedFilters.map((k) => filterFeatureMap[k]))];
        return res.status(403).json({
          success: false,
          message: `Your plan does not include: ${missingFeatures.join(", ")}. Please upgrade your plan to access this feature.`,
          code: "FEATURE_NOT_AVAILABLE",
          missingFeatures,
        });
      }

      const debugMode = req.query?.debug === "1";

      const finalResponse = await executeSearch({

        userId,

        filters,

        excludedFilters,

        debugMode,

      });

      res.status(200).json(finalResponse);

    } catch (error) {

      console.error("❌ Search Error:", error);

      if (error.meta && error.meta.body && error.meta.body.error) {

        console.error(

          "🔥 [ES_CLIENT_ERROR] Detailed:",

          JSON.stringify(error.meta.body.error, null, 2),

        );

      }

      res.status(500).json({ error: "Search failed", message: error.message });

    }

  },

  // --- Search count ---

  getSearchCount: async (req, res) => {
    try {
      const userId = req.workspaceOwner;
      const { filters = {}, excludedFilters = {} } = req.body;

      const result = await executeSearchCount({ userId, filters, excludedFilters });

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Search Count Error:", error);
      res.status(500).json({ error: "Search count failed", message: error.message });
    }
  },

  // --- Batch search (cursor-based, powered by ES) ---

  searchBatch: async (req, res) => {
    try {
      const userId = req.workspaceOwner;
      const { filters = {}, excludedFilters = {} } = req.body;

      filters.batchMode = true;

      const result = await executeSearch({ userId, filters, excludedFilters });

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Batch Search Error:", error);
      res.status(500).json({ error: "Batch search failed", message: error.message });
    }
  },

  searchBatchNext: async (req, res) => {
    try {
      const userId = req.workspaceOwner;
      const { filters = {}, excludedFilters = {}, cursor } = req.body;

      filters.cursor = cursor;
      filters.batchMode = true;

      const result = await executeSearch({ userId, filters, excludedFilters });

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Batch Next Error:", error);
      res.status(500).json({ error: "Batch next failed", message: error.message });
    }
  },

  getTotalContacts: async (req, res) => {

    try {

      const total = await contacts_v5.estimatedDocumentCount();

      res.status(200).json({ total });

    } catch (error) {

      console.error(error);

      res.status(500).json({ error: "Internal Server Error" });

    }

  },

  getItemDetailsByIds: async (req, res) => {

    try {

      const { ids } = req.body;

      if (!ids || !Array.isArray(ids)) {

        return res.status(400).json({ error: "IDs array is required" });

      }

      const contacts = await contacts_v5.find({ _id: { $in: ids } });

      res.status(200).json(contacts);

    } catch (error) {

      console.error("Error fetching items by IDs:", error);

      res.status(500).json({ error: "Internal Server Error" });

    }

  },

  findLeads: async (req, res) => {

    try {

      const { name, company, linkedin, email } = req.query;

      if (!name && !company && !linkedin && !email) {

        return res

          .status(400)

          .json({ error: "At least one search criterion is required." });

      }

      const filters = {};

      if (name) {

        filters.personName = name;

      }

      if (company) {

        filters.organizationName = company;

      }

      if (linkedin) {

        const raw = String(linkedin).trim();

        const stripped = raw

          .replace(/^https?:\/\//i, "")

          .replace(/^www\./i, "")

          .replace(/\/?$/g, "");

        const parts = stripped.split("/").filter(Boolean);

        const username = parts.length > 0 ? parts[parts.length - 1] : stripped;

        const variants = Array.from(

          new Set([raw, stripped, username].filter(Boolean)),

        );

        filters.personLinkedinUrl = variants;

        filters.organizationLinkedinUrl = variants;

      }

      if (email) {

        filters.personEmail = String(email).trim().toLowerCase();

      }

      filters.limit = 20;

      req.body = { ...req.body, filters };

      const finalResponse = await executeSearch({

        userId: req.user ? req.user.userId : null,

        filters,

        excludedFilters: {},

        debugMode: req.query?.debug === "1",

      });

      return res.status(200).json(finalResponse);

    } catch (error) {

      console.error("Error in findLeads:", error);

      res.status(500).json({ error: "Internal Server Error" });

    }

  },

  getFilterCounts: async (req, res) => {
    try {
      const { filterType } = req.query;

      const aggMap = {
        jobTitle: { field: 'title.keyword' },
        country:  { field: 'company_country.keyword' },
        industry: { field: 'industry.keyword' },
        seniority: { field: 'seniority.keyword' },
      };

      const buildAggs = () => {
        const aggs = {};
        const entries = filterType
          ? [[filterType, aggMap[filterType]]].filter(([, v]) => v)
          : Object.entries(aggMap);
        for (const [key, cfg] of entries) {
          aggs[key] = { terms: { field: cfg.field, size: 100, min_doc_count: 1 } };
        }
        return aggs;
      };

      const aggs = buildAggs();
      if (!Object.keys(aggs).length) {
        return res.status(200).json({});
      }

      const esRes = await esClient.search({
        index: 'contacts_search',
        size: 0,
        body: { aggs },
      });

      const grouped = {};
      for (const key of Object.keys(aggs)) {
        const buckets = esRes.aggregations?.[key]?.buckets || [];
        grouped[key] = buckets.map(b => ({ value: b.key, count: b.doc_count }));
      }

      res.status(200).json(grouped);
    } catch (error) {
      console.error("Error fetching filter counts:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  exportContactsCsv: async (req, res) => {

    return await exportContactsToCsv(req.body, res);

  },

  // --- Share Search State ---

  saveShareState: async (req, res) => {

    try {

      const userId = req.workspaceOwner;

      const { filters, excludedFilters, visibleColumns } = req.body;

      const shareId =

        Math.random().toString(36).substring(2, 8) + Date.now().toString(36);

      const sharedSearch = new SharedSearch({

        shareId,

        userId,

        filters,

        excludedFilters,

        visibleColumns,

      });

      await sharedSearch.save();

      const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;

      if (!frontendUrl && process.env.NODE_ENV === "production") {

        console.error("⚠️ WARNING: CLIENT_URL/FRONTEND_URL not set in production! Share links will use server host.");

      }

      const finalUrl = frontendUrl || `${req.protocol}://${req.get("host")}`;

      const page = filters?.currentPage || 1;

      const limit = filters?.limit || 25;

      res.json({

        shareId,

        url: `${finalUrl}/search?s=${shareId}&page=${page}&limit=${limit}`,

      });

    } catch (error) {

      console.error("Error saving share state:", error);

      res.status(500).json({ error: "Failed to save share state" });

    }

  },

  getCitySuggestions: async (req, res) => {

    try {

      const { query } = req.query;

      if (!query || query.length < 1) {

        return res.status(200).json({ suggestions: [] });

      }

      const isZipLike = /^\d/.test(query.trim());

      const esQuery = {

        index: "contacts_search",

        body: {

          size: 0,

          query: {

            bool: {

              should: [

                { wildcard: { "company_city": { value: `*${query}*`, case_insensitive: true } } },

                { wildcard: { "company_state": { value: `*${query}*`, case_insensitive: true } } },

                { wildcard: { "company_country": { value: `*${query}*`, case_insensitive: true } } },

                { wildcard: { "company_postal_code": { value: `${isZipLike ? "*" : ""}${query}*`, case_insensitive: true } } },

                { wildcard: { "postal_code": { value: `${isZipLike ? "*" : ""}${query}*`, case_insensitive: true } } },

              ],

              minimum_should_match: 1

            }

          },

          aggs: {

            cities: { terms: { field: "company_city", size: 10, min_doc_count: 1 } },

            states: { terms: { field: "company_state", size: 10, min_doc_count: 1 } },

            countries: { terms: { field: "company_country", size: 10, min_doc_count: 1 } },

            postal_codes: { terms: { field: "company_postal_code", size: 10, min_doc_count: 1 } },

          }

        }

      };

      const response = await esClient.search(esQuery);

      const cityBuckets = response.aggregations?.cities?.buckets?.map(bucket => bucket.key) || [];

      const stateBuckets = response.aggregations?.states?.buckets?.map(bucket => bucket.key) || [];

      const countryBuckets = response.aggregations?.countries?.buckets?.map(bucket => bucket.key) || [];

      const postalBuckets = response.aggregations?.postal_codes?.buckets?.map(bucket => bucket.key) || [];

      const suggestions = [...new Set([...cityBuckets, ...stateBuckets, ...countryBuckets, ...postalBuckets])];

      res.status(200).json({ suggestions });

    } catch (error) {

      console.error("Error fetching city suggestions:", error);

      res.status(500).json({ error: "Failed to fetch city suggestions" });

    }

  },

  getCompanyDomainSuggestions: async (req, res) => {

    try {

      let { query } = req.query;

      if (!query || query.length < 2) {

        return res.status(200).json({ suggestions: [] });

      }

      const trimmed = query.trim();

      let cleanQuery = trimmed;

      if (trimmed.includes(".") || trimmed.startsWith("http")) {

        try {

          let urlStr = trimmed;

          if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {

            urlStr = "https://" + urlStr;

          }

          const url = new URL(urlStr);

          cleanQuery = url.hostname.replace(/^www\./, "").toLowerCase();

        } catch {

          const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?([^/?]+)/i);

          if (match) cleanQuery = match[1].replace(/^www\./, "").toLowerCase();

        }

      }

      const isDomainQuery = cleanQuery.includes(".");

      let esQuery;

      if (isDomainQuery) {

        esQuery = {

          index: "contacts_search",

          body: {

            size: 0,

            query: {

              bool: {

                should: [

                  { wildcard: { "company_domain.keyword": { value: `*${cleanQuery}*` } } },

                  { wildcard: { "company_website": { value: `*${cleanQuery}*` } } }

                ],

                minimum_should_match: 1

              }

            },

            aggs: {

              companies: {

                terms: {

                  field: "company_name.keyword",

                  size: 10,

                  min_doc_count: 1

                },

                aggs: {

                  sample_domain: {

                    top_hits: {

                      size: 1,

                      _source: ["company_domain", "organization_domain", "website", "organization_website_url", "company_name"]

                    }

                  }

                }

              }

            }

          }

        };

      } else {

        esQuery = {

          index: "contacts_search",

          body: {

            size: 0,

            query: {

              wildcard: {

                "company_name.keyword": {

                  value: `${cleanQuery}*`

                }

              }

            },

            aggs: {

              companies: {

                terms: {

                  field: "company_name.keyword",

                  size: 5,

                  min_doc_count: 1

                },

                aggs: {

                  sample_domain: {

                    top_hits: {

                      size: 1,

                      _source: ["company_domain", "organization_domain", "website", "organization_website_url", "company_name"]

                    }

                  }

                }

              }

            }

          }

        };

      }

      const response = await esClient.search(esQuery);

      const companyBuckets = response.aggregations?.companies?.buckets || [];

      const suggestions = companyBuckets.map(bucket => {

        const hit = bucket.sample_domain?.hits?.hits?.[0]?._source;

        return {

          name: hit?.company_name || bucket.key,

          domain: hit?.company_domain || hit?.organization_domain || hit?.website || hit?.organization_website_url || '',

          employeeCount: bucket.doc_count

        };

      }).filter(s => s.name);

      res.status(200).json({ suggestions });

    } catch (error) {

      console.error("Error fetching company domain suggestions:", error);

      res.status(500).json({ error: "Failed to fetch company domain suggestions" });

    }

  },

  getKeywordsSuggestions: async (req, res) => {

    try {

      const { query } = req.query;

      if (!query || query.length < 2) {

        return res.status(200).json({ suggestions: [] });

      }

      const esQuery = {

        index: "contacts_search",

        body: {

          size: 30,

          _source: ["keywords"],

          query: {

            wildcard: {

              keywords: { value: `*${query}*`, case_insensitive: true }

            }

          }

        }

      };

      const response = await esClient.search(esQuery);

      const keywords = response.hits.hits

        .flatMap(hit => Array.isArray(hit._source.keywords) ? hit._source.keywords : [])

        .filter((v, i, a) => a.indexOf(v) === i)

        .slice(0, 10);

      res.status(200).json({ suggestions: keywords });

    } catch (error) {

      console.error("Error fetching keywords suggestions:", error);

      res.status(500).json({ error: "Failed to fetch keywords suggestions" });

    }

  },

  getIndustrySuggestions: async (req, res) => {

    try {

      const { query } = req.query;

      if (!query || query.length < 2) {

        return res.status(200).json({ suggestions: [] });

      }

      const esQuery = {

        index: "contacts_search",

        body: {

          size: 0,

          query: {

            wildcard: {

              "industry.keyword": {

                value: `*${query}*`,

                case_insensitive: true

              }

            }

          },

          aggs: {

            industries: {

              terms: {

                field: "industry.keyword",

                size: 10,

                min_doc_count: 1

              }

            }

          }

        }

      };

      const response = await esClient.search(esQuery);

      const suggestions = response.aggregations?.industries?.buckets?.map(bucket => bucket.key) || [];

      res.status(200).json({ suggestions });

    } catch (error) {

      console.error("Error fetching industry suggestions:", error);

      res.status(500).json({ error: "Failed to fetch industry suggestions" });

    }

  },

  getPersonNameSuggestions: async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || query.length < 2) {
        return res.status(200).json({ suggestions: [] });
      }

      const esQuery = {
        index: "contacts_search",
        body: {
          size: 30,
          _source: ["full_name"],
          query: {
            wildcard: {
              full_name: { value: `*${query}*`, case_insensitive: true }
            }
          }
        }
      };

      const response = await esClient.search(esQuery);
      const names = response.hits.hits
        .map(hit => hit._source.full_name)
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 10);

      res.status(200).json({ suggestions: names });
    } catch (error) {
      console.error("Error fetching name suggestions:", error);
      res.status(500).json({ error: "Failed to fetch name suggestions" });
    }
  },

  getShareState: async (req, res) => {

    try {

      const { shareId } = req.params;

      const sharedSearch = await SharedSearch.findOne({ shareId });

      if (!sharedSearch) {

        return res.status(404).json({ error: "Share not found" });

      }

      res.json({

        filters: sharedSearch.filters,

        excludedFilters: sharedSearch.excludedFilters,

        visibleColumns: sharedSearch.visibleColumns,

      });

    } catch (error) {

      console.error("Error retrieving share state:", error);

      res.status(500).json({ error: "Failed to retrieve share state" });

    }

  },

  getUniqueCompaniesCount: async (req, res) => {
    try {
      const userId = req.workspaceOwner;
      const { filters = {}, exact = false } = req.body;

      const baseQuery = {
        bool: {
          should: [
            { exists: { field: "company_name" } },
            { exists: { field: "organization_name" } }
          ],
          minimum_should_match: 1,
          filter: [
            {
              bool: {
                must_not: [
                  { wildcard: { "company_name": "*@*" } },
                  { wildcard: { "organization_name": "*@*" } },
                ],
              },
            },
            { exists: { field: "company_domain" } },
          ]
        }
      };

      const toArray = (v) => Array.isArray(v) ? v : (v != null ? [v] : []);

      if (filters.organizationName || filters.company) {
        const companyFilter = filters.organizationName || filters.company;
        const values = toArray(companyFilter);
        const should = values.flatMap(v => {
          const clauses = [
            { wildcard: { "company_name": { value: `*${v}*` } } },
            { wildcard: { "company_name.keyword": { value: `*${v}*` } } }
          ];
          if (v.includes(".")) {
            clauses.push({ wildcard: { "company_domain.keyword": { value: `*${v}*` } } });
            clauses.push({ wildcard: { "company_website": { value: `*${v}*` } } });
          }
          return clauses;
        });
        baseQuery.bool.filter.push({ bool: { should, minimum_should_match: 1 } });
      }

      if (filters.organizationDomain) {
        const extractDomainFromInput = (input) => {
          if (!input) return input;
          const trimmed = String(input).trim();
          if (!trimmed.includes(".") && !trimmed.startsWith("http")) return trimmed;
          try {
            let urlStr = trimmed;
            if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
              urlStr = "https://" + urlStr;
            }
            const url = new URL(urlStr);
            return url.hostname.replace(/^www\./, "");
          } catch {
            const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?([^/?]+)/i);
            return match ? match[1].replace(/^www\./, "") : trimmed;
          }
        };
        const values = toArray(filters.organizationDomain).map(extractDomainFromInput);
        const should = values.flatMap(v => [
          { wildcard: { "company_domain.keyword": { value: `*${v}*` } } },
          { wildcard: { "company_website": { value: `*${v}*` } } }
        ]);
        baseQuery.bool.filter.push({ bool: { should, minimum_should_match: 1 } });
      }

      if (filters.industry) {
        const values = toArray(filters.industry);
        const should = values.flatMap(v => [
          { wildcard: { "industry.keyword": { value: `*${v}*`, case_insensitive: true } } }
        ]);
        baseQuery.bool.filter.push({ bool: { should, minimum_should_match: 1 } });
      }

      if (filters.location) {
        const values = toArray(filters.location);
        const should = values.flatMap(v => [
          { wildcard: { "company_city": { value: `*${v}*` } } },
          { wildcard: { "company_state": { value: `*${v}*` } } },
          { wildcard: { "company_country": { value: `*${v}*` } } },
          { wildcard: { "company_postal_code": { value: `*${v}*` } } },
          { wildcard: { "postal_code": { value: `*${v}*` } } },
        ]);
        baseQuery.bool.filter.push({ bool: { should, minimum_should_match: 1 } });
      }

      if (filters.cityState) {
        const values = toArray(filters.cityState);
        const should = values.flatMap(v => [
          { wildcard: { "company_city": { value: `*${v}*` } } },
          { wildcard: { "company_state": { value: `*${v}*` } } },
        ]);
        baseQuery.bool.filter.push({ bool: { should, minimum_should_match: 1 } });
      }

      if (filters.country) {
        const values = toArray(filters.country);
        const should = values.map(v => ({ match: { "company_country": v } }));
        baseQuery.bool.filter.push({ bool: { should, minimum_should_match: 1 } });
      }

      if (filters.zip) {
        const values = toArray(filters.zip);
        const should = values.flatMap(v => [
          { wildcard: { "company_postal_code": { value: `*${v}*` } } },
          { wildcard: { "postal_code": { value: `*${v}*` } } },
        ]);
        baseQuery.bool.filter.push({ bool: { should, minimum_should_match: 1 } });
      }

      if (filters.employeeRange) {
        const values = toArray(filters.employeeRange);
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
          baseQuery.bool.filter.push({ bool: { should: rangeQueries, minimum_should_match: 1 } });
        }
      }

      if (filters.hasCompany === true || filters.hasCompany === "true") {
        baseQuery.bool.filter.push({
          bool: {
            should: [
              { exists: { field: "company_name" } },
              { exists: { field: "organization_name" } }
            ],
            minimum_should_match: 1
          }
        });
      }

      if (filters.keywords) {
        const values = toArray(filters.keywords);
        const should = values.map(v => ({
          match: { "keywords": { query: v, operator: "and" } },
        }));
        baseQuery.bool.filter.push({ bool: { should, minimum_should_match: 1 } });
      }

      let total;

      if (exact) {
        total = await getExactUniqueCompaniesCount(esClient, baseQuery);
      } else {
        const countResponse = await esClient.count({
          index: "contacts_search",
          query: baseQuery
        });
        total = countResponse?.count || 0;
      }

      let companiesTotal = 0;
      try {
        if (exact) {
          companiesTotal = total;
        } else {
          const cardResponse = await esClient.search({
            index: "contacts_search",
            size: 0,
            body: {
              query: baseQuery,
              aggs: {
                unique_companies: { cardinality: { field: "company_domain", precision_threshold: 30000 } }
              }
            }
          });
          companiesTotal = cardResponse?.aggregations?.unique_companies?.value || 0;
        }
      } catch (companiesErr) {
        console.error("[Companies Count] Error:", companiesErr.message);
        companiesTotal = 0;
      }

      const SavedCompanies = require("../models/SavedCompanies");
      const bestSaved = await SavedCompanies.countDocuments({ userId });

      res.status(200).json({
        total: companiesTotal,
        saved: bestSaved,
        new: Math.max(0, companiesTotal - bestSaved),
      });

    } catch (error) {
      console.error("Error getting unique companies count:", error);
      res.status(500).json({ error: "Failed to get companies count", details: error.message });
    }
  },

  // Get exact unique companies count
  getExactUniqueCompaniesCount: async (req, res) => {
    try {
      req.body.exact = true;
      return await searchController.getUniqueCompaniesCount(req, res);
    } catch (error) {
      console.error("Error getting exact companies count:", error);
      res.status(500).json({ error: "Failed to get exact count", details: error.message });
    }
  },

  // ── Company search (deduplicated, aggregation-based) ──────────────────

  searchCompanies: async (req, res) => {
    try {
      const userId = req.workspaceOwner;
      const { filters = {} } = req.body;

      const result = await executeCompanySearch({
        userId,
        filters,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error searching companies:", error);
      res.status(500).json({ error: "Company search failed", message: error.message });
    }
  },

};

module.exports = searchController;

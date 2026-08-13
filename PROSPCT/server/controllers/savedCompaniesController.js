const mongoose = require("mongoose");
const SavedCompanies = require("../models/SavedCompanies");
const Contacts_V5 = require("../models/Contacts");
const User = require("../models/User");
const List = require("../models/List");
const CompaniesCache = require("../models/CompaniesCache");
async function fetchCompaniesByFilters(filters) {
  const conditions = [];

  const toArray = (v) => Array.isArray(v) ? v : (v != null ? [v] : []);

  if (filters.organizationName || filters.company) {
    const companyFilter = filters.organizationName || filters.company;
    const values = toArray(companyFilter);
    const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (valid.length > 0) {
      conditions.push({
        $or: valid.map(v => {
          const prefix = String(v).toLowerCase();
          return {
            $or: [
              { normalized_name: { $gte: prefix, $lt: prefix + '\uffff' } },
              { sanitized_organization_name_unanalyzed: { $gte: prefix, $lt: prefix + '\uffff' } },
            ]
          };
        })
      });
    }
  }

  if (filters.organizationDomain) {
    const values = toArray(filters.organizationDomain);
    const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (valid.length > 0) {
      conditions.push({
        $or: valid.map(v => ({
          organization_domain: { $gte: v, $lt: v + '\uffff' }
        }))
      });
    }
  }

  if (filters.industry) {
    const values = toArray(filters.industry);
    const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (valid.length > 0) {
      conditions.push({
        organization_industries: { $in: valid.map(v => String(v).toLowerCase()) }
      });
    }
  }

  if (filters.location || filters.cityState) {
    const locValues = toArray(filters.location || filters.cityState);
    const valid = locValues.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (valid.length > 0) {
      const should = [];
      for (const val of valid) {
        should.push(
          { organization_hq_location_city: { $gte: val, $lt: val + '\uffff' } },
          { organization_hq_location_state: { $gte: val, $lt: val + '\uffff' } },
        );
      }
      conditions.push({ $or: should });
    }
  }

  if (filters.country) {
    const values = toArray(filters.country);
    const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (valid.length > 0) {
      conditions.push({ organization_hq_location_country: { $in: valid } });
    }
  }

  if (filters.zip) {
    const values = toArray(filters.zip);
    const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (valid.length > 0) {
      conditions.push({
        $or: valid.map(v => ({
          organization_hq_location_postal_code: { $gte: v, $lt: v + '\uffff' }
        }))
      });
    }
  }

  if (filters.employeeRange || filters.employees) {
    const empValues = toArray(filters.employeeRange || filters.employees);
    const valid = empValues.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (valid.length > 0) {
      const rangeConditions = valid.map(range => {
        const cleanStr = String(range).replace(/\s/g, "");
        const cond = {};
        if (/andmore/i.test(cleanStr) || cleanStr.endsWith("+")) {
          const numStr = cleanStr.replace(/andmore/i, "").replace(/\+$/, "");
          const num = parseInt(numStr, 10);
          if (!Number.isNaN(num)) cond.$gte = num;
        } else if (cleanStr.includes("-")) {
          const parts = cleanStr.split("-").filter(p => p.trim());
          if (parts.length === 2) {
            const minVal = parseInt(parts[0], 10);
            const maxVal = parseInt(parts[1], 10);
            if (!Number.isNaN(minVal)) cond.$gte = minVal;
            if (!Number.isNaN(maxVal)) cond.$lte = maxVal;
          }
        }
        return Object.keys(cond).length ? { organization_num_current_employees: cond } : null;
      }).filter(Boolean);
      if (rangeConditions.length) conditions.push({ $or: rangeConditions });
    }
  }

  if (filters.keywords) {
    const values = toArray(filters.keywords);
    const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
    if (valid.length > 0) {
      conditions.push({
        $or: valid.map(v => ({
          organization_relevant_keywords: { $gte: v, $lt: v + '\uffff' }
        }))
      });
    }
  }

  // Default quality filter: Good+ (score >= 60) — matches /api/search/companies-count
  const qualityThreshold = parseInt(filters.quality, 10);
  if (!isNaN(qualityThreshold)) {
    conditions.push({ quality_score: { $gte: qualityThreshold } });
  } else if (filters.quality !== 'all') {
    conditions.push({ quality_score: { $gte: 60 } });
  }

  const query = conditions.length > 0 ? { $and: conditions } : {};

  const companies = await CompaniesCache.find(query)
    .allowDiskUse()
    .maxTimeMS(300000)
    .lean();

  return companies.map((doc) => ({
    _id: String(doc._id),
    _source: doc,
    companyId: String(doc._id),
  }));
}

const savedCompaniesController = {
  // Save or update companies for a user
  addSavedCompanies: async (req, res) => {
    const { savedItems, listNames = [], filters } = req.body;
    const userId = req.workspaceOwner;

    console.log("[SAVE COMPANIES SRV] addSavedCompanies called");
    console.log("[SAVE COMPANIES SRV] savedItems:", savedItems ? `Array(${savedItems.length})` : "undefined");
    console.log("[SAVE COMPANIES SRV] listNames:", listNames);
    console.log("[SAVE COMPANIES SRV] filters:", JSON.stringify(filters));
    console.log("[SAVE COMPANIES SRV] filters keys:", filters ? Object.keys(filters) : "no filters");
    console.log("[SAVE COMPANIES SRV] filters keys length:", filters ? Object.keys(filters).length : 0);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    try {
      let listIds = [];
      if (listNames.length > 0) {
        const lists = await createOrFetchLists(userId, listNames, "companies");
        listIds = lists.map((list) => list._id);
      }

      const BATCH_SIZE = 10000;
      let totalInserted = 0;
      let totalModified = 0;

      const hasFilters = filters !== undefined;
      const hasSavedItems = savedItems && savedItems.length > 0;

      if (hasSavedItems && !hasFilters) {
        // Page-level selection (non-selectAll) — process client items directly
        const itemsToSave = Array.isArray(savedItems) ? savedItems : [savedItems];
        console.log("[SAVE COMPANIES SRV] saving", itemsToSave.length, "items from client directly");

        for (let i = 0; i < itemsToSave.length; i += BATCH_SIZE) {
          const batch = itemsToSave.slice(i, i + BATCH_SIZE).map((item) => {
            const companyId = item && typeof item === "object"
              ? (item.companyId || item._id)
              : String(item);
            const source = item._source || item.companyData?._source || item.companyData || item;
            return {
              updateOne: {
                filter: { userId, companyId },
                update: {
                  $setOnInsert: { userId, companyId, companyData: { _id: companyId, _source: source } },
                  $addToSet: { listIds: { $each: listIds } },
                },
                upsert: true,
              },
            };
          });

          const result = await SavedCompanies.bulkWrite(batch, { ordered: false });
          totalInserted += result.upsertedCount;
          totalModified += result.modifiedCount;
        }

        console.log("[SAVE COMPANIES SRV] client items save complete — inserted:", totalInserted, "modified:", totalModified);
      } else if (hasFilters) {
        // selectAll mode — stream from CompaniesCache with filters + quality filter
        console.log("[SAVE COMPANIES SRV] selectAll mode: streaming companies by filters...");

        const conditions = [];

        if (Object.keys(filters).length > 0) {
          const toArray = (v) => Array.isArray(v) ? v : (v != null ? [v] : []);

          if (filters.organizationName || filters.company) {
            const companyFilter = filters.organizationName || filters.company;
            const values = toArray(companyFilter);
            const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
            if (valid.length > 0) {
              conditions.push({
                $or: valid.map(v => {
                  const prefix = String(v).toLowerCase();
                  return {
                    $or: [
                      { normalized_name: { $gte: prefix, $lt: prefix + '\uffff' } },
                      { sanitized_organization_name_unanalyzed: { $gte: prefix, $lt: prefix + '\uffff' } },
                    ]
                  };
                })
              });
            }
          }

          if (filters.organizationDomain) {
            const values = toArray(filters.organizationDomain);
            const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
            if (valid.length > 0) {
              conditions.push({
                $or: valid.map(v => ({
                  organization_domain: { $gte: v, $lt: v + '\uffff' }
                }))
              });
            }
          }

          if (filters.industry) {
            const values = toArray(filters.industry);
            const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
            if (valid.length > 0) {
              conditions.push({
                organization_industries: { $in: valid.map(v => String(v).toLowerCase()) }
              });
            }
          }

          if (filters.location || filters.cityState) {
            const locValues = toArray(filters.location || filters.cityState);
            const valid = locValues.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
            if (valid.length > 0) {
              const should = [];
              for (const val of valid) {
                should.push(
                  { organization_hq_location_city: { $gte: val, $lt: val + '\uffff' } },
                  { organization_hq_location_state: { $gte: val, $lt: val + '\uffff' } },
                );
              }
              conditions.push({ $or: should });
            }
          }

          if (filters.country) {
            const values = toArray(filters.country);
            const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
            if (valid.length > 0) {
              conditions.push({ organization_hq_location_country: { $in: valid } });
            }
          }

          if (filters.zip) {
            const values = toArray(filters.zip);
            const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
            if (valid.length > 0) {
              conditions.push({
                $or: valid.map(v => ({
                  organization_hq_location_postal_code: { $gte: v, $lt: v + '\uffff' }
                }))
              });
            }
          }

          if (filters.employeeRange || filters.employees) {
            const empValues = toArray(filters.employeeRange || filters.employees);
            const valid = empValues.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
            if (valid.length > 0) {
              const rangeConditions = valid.map(range => {
                const cleanStr = String(range).replace(/\s/g, "");
                const cond = {};
                if (/andmore/i.test(cleanStr) || cleanStr.endsWith("+")) {
                  const numStr = cleanStr.replace(/andmore/i, "").replace(/\+$/, "");
                  const num = parseInt(numStr, 10);
                  if (!Number.isNaN(num)) cond.$gte = num;
                } else if (cleanStr.includes("-")) {
                  const parts = cleanStr.split("-").filter(p => p.trim());
                  if (parts.length === 2) {
                    const minVal = parseInt(parts[0], 10);
                    const maxVal = parseInt(parts[1], 10);
                    if (!Number.isNaN(minVal)) cond.$gte = minVal;
                    if (!Number.isNaN(maxVal)) cond.$lte = maxVal;
                  }
                }
                return Object.keys(cond).length ? { organization_num_current_employees: cond } : null;
              }).filter(Boolean);
              if (rangeConditions.length) conditions.push({ $or: rangeConditions });
            }
          }

          if (filters.keywords) {
            const values = toArray(filters.keywords);
            const valid = values.filter(v => v !== undefined && v !== null && String(v).trim() !== "");
            if (valid.length > 0) {
              conditions.push({
                $or: valid.map(v => ({
                  organization_relevant_keywords: { $gte: v, $lt: v + '\uffff' }
                }))
              });
            }
          }
        }

        // Always apply quality filter — matches searchService.js default
        const qualityThreshold = parseInt(filters?.quality, 10);
        if (!isNaN(qualityThreshold)) {
          conditions.push({ quality_score: { $gte: qualityThreshold } });
        } else if (!filters || filters?.quality !== 'all') {
          conditions.push({ quality_score: { $gte: 60 } });
        }

        const query = conditions.length > 0 ? { $and: conditions } : {};
        const cursor = CompaniesCache.find(query)
          .allowDiskUse()
          .maxTimeMS(300000)
          .lean()
          .cursor();

        let batch = [];
        for await (const doc of cursor) {
          const companyId = String(doc._id);
          batch.push({
            updateOne: {
              filter: { userId, companyId },
              update: {
                $setOnInsert: { userId, companyId, companyData: { _id: companyId, _source: doc } },
                $addToSet: { listIds: { $each: listIds } },
              },
              upsert: true,
            },
          });

          if (batch.length >= BATCH_SIZE) {
            const result = await SavedCompanies.bulkWrite(batch, { ordered: false });
            totalInserted += result.upsertedCount;
            totalModified += result.modifiedCount;
            batch = [];
            console.log("[SAVE COMPANIES SRV] batch saved — total so far: inserted", totalInserted, "modified", totalModified);
          }
        }

        if (batch.length > 0) {
          const result = await SavedCompanies.bulkWrite(batch, { ordered: false });
          totalInserted += result.upsertedCount;
          totalModified += result.modifiedCount;
        }

        console.log("[SAVE COMPANIES SRV] cursor save complete — inserted:", totalInserted, "modified:", totalModified);
      } else {
        console.log("[SAVE COMPANIES SRV] no items to save, returning 400");
        return res.status(400).json({ error: "No valid items to save" });
      }

      res.status(200).json({
        message: "Companies saved successfully",
        inserted: totalInserted,
        modified: totalModified,
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to save companies", details: error.message });
    }
  },

  // Get saved companies for a user
  getSavedCompaniesList: async (req, res) => {
    try {
      // Multi-tenant: saved items belong to workspace owner
      const userId = req.workspaceOwner;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Fetch all saved companies for user
      const savedCompanies = await SavedCompanies.find({ userId })
        .select("companyId companyData userId listIds createdAt updatedAt")
        .lean();

      const totalSavedCompanies = savedCompanies.length;

      res.status(200).json({
        data: savedCompanies,
        totalSavedCompanies,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get saved companies" });
    }
  },

  // Delete saved companies for a user
  deleteSavedCompanies: async (req, res) => {
    try {
      const userId = req.workspaceOwner;
      const { companyIds } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      if (!companyIds || companyIds.length === 0) {
        return res.status(400).json({ error: "Company IDs are required" });
      }


      // Delete from SavedCompanies by companyId (Elasticsearch ID)
      const savedCompaniesResult = await SavedCompanies.deleteMany({
        userId,
        companyId: { $in: companyIds },
      });


      res.status(200).json({
        message: "Saved companies removed successfully",
        deleted: savedCompaniesResult.deletedCount,
      });
    } catch (error) {
      console.error("[Delete Companies Controller] Error:", error);
      res.status(500).json({ error: "Failed to delete saved companies" });
    }
  },

  // Delete ALL saved companies for a user
  deleteAllSavedCompanies: async (req, res) => {
    try {
      const userId = req.workspaceOwner;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Delete all saved companies for this user from SavedCompanies only
      const savedCompaniesResult = await SavedCompanies.deleteMany({ userId });

      res.status(200).json({
        message: "All saved companies removed successfully",
        deleted: savedCompaniesResult.deletedCount,
      });
    } catch (error) {
      console.error("[DeleteAll Companies Controller] Error:", error);
      res.status(500).json({ error: "Failed to delete all saved companies" });
    }
  },

  // Clean up duplicate companies for a user
  cleanupDuplicateCompanies: async (req, res) => {
    try {
      const userId = req.workspaceOwner;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }


      // Find all saved companies for this user
      const allCompanies = await SavedCompanies.find({ userId }).lean();

      // Group by companyId
      const groupedByCompanyId = {};
      allCompanies.forEach(company => {
        const companyId = String(company.companyId);
        if (!groupedByCompanyId[companyId]) {
          groupedByCompanyId[companyId] = [];
        }
        groupedByCompanyId[companyId].push(company);
      });

      // Find duplicates (companyIds with more than 1 entry)
      const duplicates = Object.entries(groupedByCompanyId).filter(([_, items]) => items.length > 1);

      if (duplicates.length === 0) {
        return res.status(200).json({
          message: "No duplicates found",
          totalCompanies: allCompanies.length,
          duplicateGroups: 0,
          merged: 0,
          deleted: 0,
        });
      }

      let deletedCount = 0;
      let mergedCount = 0;

      for (const [companyId, items] of duplicates) {

        // Keep oldest one (by createdAt), or first if no date
        items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        const keep = items[0];
        const remove = items.slice(1);


        // Merge all listIds from all items (including one we keep)
        const allListIds = items.flatMap(item => item.listIds || []);
        const uniqueListIds = [...new Set(allListIds.map(String))];

        // Update kept record with merged listIds
        const updateResult = await SavedCompanies.updateOne(
          { _id: keep._id },
          { $set: { listIds: uniqueListIds } }
        );

        // Delete duplicates - use String comparison for _id
        const idsToDelete = remove.map(item => String(item._id));

        if (idsToDelete.length > 0) {
          const result = await SavedCompanies.deleteMany({
            userId,
            _id: { $in: idsToDelete.map(id => new mongoose.Types.ObjectId(id)) }
          });
          deletedCount += result.deletedCount;
        }

        mergedCount++;
      }


      res.status(200).json({
        message: "Duplicate companies cleaned up successfully",
        totalCompanies: allCompanies.length,
        duplicateGroups: duplicates.length,
        merged: mergedCount,
        deleted: deletedCount,
      });
    } catch (error) {
      console.error("[Cleanup Companies Controller] Error:", error);
      res.status(500).json({ error: "Failed to cleanup duplicates" });
    }
  }
};

module.exports = savedCompaniesController;

// function to save or fetch list
async function createOrFetchLists(userId, listNames, type = "contacts") {

  // Fetch existing lists that match list names for given user
  const existingLists = await List.find({ userId, name: { $in: listNames }, type });

  // Get names of existing lists
  const existingListNames = existingLists.map((list) => list.name);

  // Filter out new list names that don't exist yet
  const newLists = listNames
    .filter((name) => !existingListNames.includes(name))
    .map((name) => ({
      userId,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      type,
    }));

  // Insert new lists into database
  let insertedLists = [];
  if (newLists.length > 0) {
    insertedLists = await List.insertMany(newLists);
  }

  // Combine existing and newly created lists
  const allLists = [...existingLists, ...insertedLists];

  // Return both existing and newly created lists
  return allLists;
}

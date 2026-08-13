const SavedSearch = require("../models/SavedSearch");

// helper to strip out empty filter values
const cleanFiltersObject = (obj) => {
  if (!obj || typeof obj !== "object") return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => {
      if (value == null || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value).length > 0;
      return true;
    })
  );
};

const savedSearchController = {
  addSaveSearch: async (req, res) => {
    try {
      const { searchName, filters, excludedFilters } = req.body;
      // Multi-tenant: scope saved search to workspace owner
      const userId = req.workspaceOwner;
      // sanitize filters before writing
      const cleanFilters = cleanFiltersObject(filters);
      const cleanExcluded = cleanFiltersObject(excludedFilters);
      const savedSearch = new SavedSearch({
        searchName,
        filters: cleanFilters,
        excludedFilters: cleanExcluded,
        userId,
      });
      await savedSearch.save();
      res.status(200).json({ message: "Search saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  // get saved search by search id
  getSavedSearchById: async (req, res) => {
    try {
      const { searchId } = req.params;

      // Multi-tenant: verify saved search belongs to workspace
      const savedSearch = await SavedSearch.findOne({ _id: searchId, userId: req.workspaceOwner });
      res.status(200).json({ savedSearch });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  // get all saved searches for a workspace
  getSavedSearches: async (req, res) => {
    try {
      // Multi-tenant: scope saved searches to workspace owner
      const userId = req.workspaceOwner;
      const savedSearches = await SavedSearch.find({ userId })
        .sort({ createdAt: -1 }); // no limit so frontend can paginate

      res.status(200).json(savedSearches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved searches" });
    }
  },

  deleteSavedSearch: async (req, res) => {
    try {
      const { id } = req.params;
      // Multi-tenant: scope deletion to workspace owner
      await SavedSearch.deleteOne({ _id: id, userId: req.workspaceOwner });
      res.status(200).json({ message: "Saved search deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete saved search" });
    }
  },
};

module.exports = savedSearchController;

const mongoose = require("mongoose");
const RecentSearch = require("../models/RecentSearch");

// Called from MAIN search controller after successful search
// utility used by both controllers to strip out empty values
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

exports.saveRecentSearch = async (userId, filters, excludedFilters) => {
  try {
    // sanitize input before saving
    const cleaned = cleanFiltersObject(filters);
    const cleanedExcluded = cleanFiltersObject(excludedFilters);

    if (Object.keys(cleaned).length === 0) return;

    await RecentSearch.deleteOne({
      userId,
      "searchParams.filters": cleaned,
      "searchParams.excludedFilters": cleanedExcluded,
    });

    await RecentSearch.create({
      userId,
      searchParams: { filters: cleaned, excludedFilters: cleanedExcluded },
    });
    const searches = await RecentSearch.find({ userId })
      .sort({ createdAt: -1 })
      .select("_id");

    if (searches.length > 50) {
      const extraIds = searches.slice(50).map((s) => s._id);
      await RecentSearch.deleteMany({ _id: { $in: extraIds } });
    }
  } catch (err) {
    console.error("Recent search save error:", err);
  }
};

// Fetch recent searches for UI (scoped to workspace)
exports.getRecentSearches = async (req, res) => {
  try {
    // Multi-tenant: scope recent searches to workspace owner
    const searches = await RecentSearch.find({ userId: req.workspaceOwner })
      .sort({ createdAt: -1 }); // removed limit so frontend can decide

    res.json(searches);
  } catch (error) {
    console.error("Get recent searches error:", error);
    res.status(500).json({ message: "Failed to fetch recent searches" });
  }
};

// API route handler for creating a recent search via frontend
exports.createRecentSearch = async (req, res) => {
  try {
    // Multi-tenant: save recent search under workspace owner
    const userId = req.workspaceOwner;
    const { filters, excludedFilters } = req.body;
    await exports.saveRecentSearch(userId, filters, excludedFilters);
    res.status(200).json({ message: "Recent search saved" });
  } catch (err) {
    console.error("Create recent search error:", err);
    res.status(500).json({ message: "Failed to save recent search" });
  }
};

// delete helper
exports.deleteRecentSearch = async (req, res) => {
  try {
    const { id } = req.params;
    // Multi-tenant: scope deletion to workspace owner
    await RecentSearch.deleteOne({ _id: id, userId: req.workspaceOwner });
    res.status(200).json({ message: "Recent search deleted" });
  } catch (err) {
    console.error("Delete recent search error:", err);
    res.status(500).json({ message: "Failed to delete recent search" });
  }
};

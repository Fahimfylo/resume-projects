const List = require("../models/List");
const Folder = require("../models/Folder");
const listController = {
  addList: async (req, res) => {
    try {
      const { list } = req.body;
      if (!list || !list.name) {
        return res.status(400).json({ message: "List name is required" });
      }

      // Multi-tenant: scope lists to workspace owner
      const userId = req.workspaceOwner;
      const slug = list.name.replace(/\s+/g, "-").toLowerCase();

      // Ensure slug is unique per workspace and type
      const existingList = await List.findOne({ userId, slug, type: list.type || "contacts" });
      if (existingList) {
        return res.status(400).json({ message: "List already exists" });
      }

      const newList = new List({
        userId,
        name: list.name,
        slug,
        items: Array.isArray(list.items) ? list.items : [],
        folderId: list.folderId || null,
        type: list.type || "contacts",
      });
      await newList.save();
      res.status(200).json({ message: "List added successfully", list: newList });
    } catch (err) {
      res.status(500).json(err);
    }
  },

  addItemToList: async (req, res) => {
    try {
      const { listIds, itemIds } = req.body;
      if (!Array.isArray(listIds) || !Array.isArray(itemIds)) {
        return res.status(400).json({ message: "Invalid input data" });
      }

      for (const listId of listIds) {
        const list = await List.findById(listId);
        if (!list) {
          return res.status(404).json({ message: "List not found" });
        }

        list.items = [...new Set([...list.items, ...itemIds])];
        await list.save();
      }
      return res
        .status(200)
        .json({ message: "Items added to lists successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get lists of a workspace (optionally filtered by folder)
  getListByUserId: async (req, res) => {
    // Multi-tenant: scope lists to workspace owner
    const userId = req.workspaceOwner;
    const { folderId } = req.query;

    try {
      const filter = { userId };
      if (folderId) {
        filter.folderId = folderId;
      }

      // Optimize: Only populate user and folder, skip items (not used in current system)
      // Use lean() for faster queries and less memory
      const lists = await List.find(filter)
        .select("name slug userId folderId type items createdAt updatedAt")
        .populate("userId", "username firstName lastName email")
        .populate("folderId", "name")
        .lean();

      // Compute contact and company counts per list
      const listIds = lists.map(list => list._id);
      const SavedContacts = require("../models/SavedContacts");
      const SavedCompanies = require("../models/SavedCompanies");

      const [contactCounts, companyCounts] = await Promise.all([
        SavedContacts.aggregate([
          { $match: { userId, listIds: { $in: listIds } } },
          { $unwind: "$listIds" },
          { $group: { _id: "$listIds", count: { $sum: 1 } } }
        ]),
        SavedCompanies.aggregate([
          { $match: { userId, listIds: { $in: listIds } } },
          { $unwind: "$listIds" },
          { $group: { _id: "$listIds", count: { $sum: 1 } } }
        ])
      ]);

      const contactCountMap = new Map(contactCounts.map(c => [String(c._id), c.count]));
      const companyCountMap = new Map(companyCounts.map(c => [String(c._id), c.count]));

      const listsWithCount = lists.map(list => ({
        ...list,
        contactCount: contactCountMap.get(String(list._id)) || 0,
        companyCount: companyCountMap.get(String(list._id)) || 0,
        totalCount: (contactCountMap.get(String(list._id)) || 0) + (companyCountMap.get(String(list._id)) || 0)
      }));

      res.status(200).json(listsWithCount);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  // Get all data needed for lists page in one call
  getListsPageData: async (req, res) => {
    const userId = req.workspaceOwner;
    const { folderId } = req.query;

    try {
      const SavedContacts = require("../models/SavedContacts");

      // Run all queries in parallel
      const [lists, allLists, folders] = await Promise.all([
        // Lists for current folder view
        List.find(folderId ? { userId, folderId } : { userId })
          .select("name slug userId folderId type items createdAt updatedAt")
          .populate("userId", "username firstName lastName email")
          .populate("folderId", "name")
          .lean(),
        // All lists (for sidebar counts)
        List.find({ userId })
          .select("name folderId type")
          .lean(),
        // All folders
        Folder.find({ userId })
          .select("name createdAt")
          .lean()
      ]);

      // Count both contacts and companies per list
      const listIds = allLists.map(list => list._id);
      
      // Count contacts per list
      const contactCounts = await SavedContacts.aggregate([
        { $match: { userId, listIds: { $in: listIds } } },
        { $unwind: "$listIds" },
        { $group: { _id: "$listIds", count: { $sum: 1 } } }
      ]);

      // Count companies per list
      const SavedCompanies = require("../models/SavedCompanies");
      const companyCounts = await SavedCompanies.aggregate([
        { $match: { userId, listIds: { $in: listIds } } },
        { $unwind: "$listIds" },
        { $group: { _id: "$listIds", count: { $sum: 1 } } }
      ]);

      const contactCountMap = new Map(contactCounts.map(c => [String(c._id), c.count]));
      const companyCountMap = new Map(companyCounts.map(c => [String(c._id), c.count]));

      // Add both contact and company counts to each list
      const listsWithCount = lists.map(list => ({
        ...list,
        contactCount: contactCountMap.get(String(list._id)) || 0,
        companyCount: companyCountMap.get(String(list._id)) || 0,
        totalCount: (contactCountMap.get(String(list._id)) || 0) + (companyCountMap.get(String(list._id)) || 0)
      }));

      res.status(200).json({
        lists: listsWithCount,
        allLists,
        folders,
        totalCount: allLists.length
      });
    } catch (err) {
      console.error("Error fetching lists page data:", err);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  },

  updateList: async (req, res) => {
    // Multi-tenant: scope to workspace owner
    const userId = req.workspaceOwner;
    const { id } = req.params;
    const { name, folderId } = req.body;

    try {
      const list = await List.findOne({ _id: id, userId });
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }

      if (name !== undefined) list.name = name;
      // Allow unassigning folder by passing null/empty string
      list.folderId = folderId || null;
      await list.save();

      const populatedList = await List.findById(id)
        .populate("userId", "username firstName lastName email")
        .populate("folderId", "name");

      return res.status(200).json({ message: "List updated", list: populatedList });
    } catch (error) {
      console.error("Error updating list:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteList: async (req, res) => {
    // Multi-tenant: scope to workspace owner
    const userId = req.workspaceOwner;
    const { id } = req.params;

    try {
      const list = await List.findOne({ _id: id, userId });
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }

      // Find contacts that belong to this list
      const SavedContacts = require("../models/SavedContacts");
      const SavedCompanies = require("../models/SavedCompanies");
      const SavedItem = require("../models/SavedItem");

      // Find contacts where this list is in their listIds
      const contactsInList = await SavedContacts.find({
        userId,
        listIds: id,
      });

      // Find companies where this list is in their listIds
      const companiesInList = await SavedCompanies.find({
        userId,
        listIds: id,
      });

      // For each contact:
      // - If it ONLY belongs to this list, delete the contact entirely
      // - If it belongs to multiple lists, just remove this list from listIds
      const contactsToDelete = [];
      const contactsToUpdate = [];

      for (const contact of contactsInList) {
        if (contact.listIds.length <= 1) {
          // Only this list - delete contact
          contactsToDelete.push(contact.contactId);
        } else {
          // Multiple lists - just remove this list from listIds
          contactsToUpdate.push(contact._id);
        }
      }

      // For each company:
      // - If it ONLY belongs to this list, delete the company entirely
      // - If it belongs to multiple lists, just remove this list from listIds
      const companiesToDelete = [];
      const companiesToUpdate = [];

      for (const company of companiesInList) {
        if (company.listIds.length <= 1) {
          // Only this list - delete company
          companiesToDelete.push(company.companyId);
        } else {
          // Multiple lists - just remove this list from listIds
          companiesToUpdate.push(company._id);
        }
      }

      // Delete contacts that only belong to this list
      if (contactsToDelete.length > 0) {
        await SavedContacts.deleteMany({
          userId,
          contactId: { $in: contactsToDelete },
        });
        await SavedItem.deleteMany({
          userId,
          contactId: { $in: contactsToDelete },
        });
      }

      // Delete companies that only belong to this list
      if (companiesToDelete.length > 0) {
        await SavedCompanies.deleteMany({
          userId,
          companyId: { $in: companiesToDelete },
        });
      }

      // Remove list from listIds for contacts in multiple lists
      if (contactsToUpdate.length > 0) {
        await SavedContacts.updateMany(
          { _id: { $in: contactsToUpdate } },
          { $pull: { listIds: id } }
        );
        await SavedItem.updateMany(
          { _id: { $in: contactsToUpdate } },
          { $pull: { listIds: id } }
        );
      }

      // Remove list from listIds for companies in multiple lists
      if (companiesToUpdate.length > 0) {
        await SavedCompanies.updateMany(
          { _id: { $in: companiesToUpdate } },
          { $pull: { listIds: id } }
        );
      }

      // Delete the list
      await list.deleteOne();

      return res.status(200).json({
        message: "List deleted",
        contactsDeleted: contactsToDelete.length,
        contactsUpdated: contactsToUpdate.length,
        companiesDeleted: companiesToDelete.length,
        companiesUpdated: companiesToUpdate.length,
      });
    } catch (error) {
      console.error("Error deleting list:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // Get list data with both contacts and companies for a specific list
  getListData: async (req, res) => {
    const userId = req.workspaceOwner;
    const { listId } = req.params;

    try {
      const SavedContacts = require("../models/SavedContacts");
      const SavedCompanies = require("../models/SavedCompanies");

      // Get list details
      const list = await List.findOne({ _id: listId, userId });
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }

      // Get contacts in this list
      const contacts = await SavedContacts.find({
        userId,
        listIds: listId,
      }).lean();

      // Get companies in this list
      const companies = await SavedCompanies.find({
        userId,
        listIds: listId,
      }).lean();

      res.status(200).json({
        list,
        contacts,
        companies,
        contactCount: contacts.length,
        companyCount: companies.length,
        totalCount: contacts.length + companies.length,
      });
    } catch (err) {
      console.error("Error fetching list data:", err);
      res.status(500).json({ error: "Failed to fetch list data" });
    }
  },
};

module.exports = listController;

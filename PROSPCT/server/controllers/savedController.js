const mongoose = require("mongoose");
const SavedItem = require("../models/SavedItem");
const SavedContacts = require("../models/SavedContacts");
const Contacts_V5 = require("../models/Contacts");
const User = require("../models/User");
const List = require("../models/List");
const savedController = {
  // Save or update items for a user
  addSavedItems: async (req, res) => {
    const { savedItems, listNames = [], filters } = req.body;
    const userId = req.workspaceOwner;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    try {
      // Step 1: Resolve lists (shared by both paths)
      let listIds = [];
      if (listNames.length > 0) {
        const lists = await createOrFetchLists(userId, listNames, "contacts");
        listIds = lists.map((list) => list._id);
      }

      // ── BATCH PATH: filters provided (selectAllMode) ────────────
      if (filters && Object.keys(filters).length > 0) {
        const { buildMongoQuery } = require("../services/searchService");
        const { fieldConfig } = require("../utils/searchQueryBuilder");

        const searchFilterKeys = Object.keys(fieldConfig);
        const cleanFilters = {};
        Object.entries(filters).forEach(([key, value]) => {
          if (searchFilterKeys.includes(key)) cleanFilters[key] = value;
        });

        const query = buildMongoQuery(cleanFilters, "total", null, [], {});
        const cursor = Contacts_V5.find(query).batchSize(5000).lean().cursor();

        const BATCH_SIZE = 5000;
        let totalInserted = 0;
        let docBatch = [];

        for await (const doc of cursor) {
          docBatch.push(doc);
          if (docBatch.length >= BATCH_SIZE) {
            const r = await SavedContacts.bulkWrite(
              docBatch.map(d => ({
                insertOne: {
                  document: { userId, contactId: String(d._id), contactData: d, listIds },
                },
              })),
              { ordered: false }
            );
            totalInserted += r.insertedCount || 0;
            docBatch = [];
          }
        }

        if (docBatch.length > 0) {
          const r = await SavedContacts.bulkWrite(
            docBatch.map(d => ({
              insertOne: {
                document: { userId, contactId: String(d._id), contactData: d, listIds },
              },
            })),
            { ordered: false }
          );
          totalInserted += r.insertedCount || 0;
        }

        return res.status(200).json({
          message: "Items saved successfully",
          inserted: totalInserted,
          skipped: 0,
        });
      }

      // ── INDIVIDUAL PATH: savedItems provided ───────────────────
      if (!savedItems) {
        return res.status(400).json({ error: "Saved items are required" });
      }

      const itemsToSave = Array.isArray(savedItems) ? savedItems : [savedItems];
      if (itemsToSave.length === 0) {
        return res.status(400).json({ error: "No valid items to save" });
      }

      const contactIds = itemsToSave.map(item =>
        typeof item === "object" && item._id ? item._id : String(item)
      );

      // Query with both string and ObjectId to handle whatever _id type is in DB
      const searchIds = contactIds.flatMap(id => {
        const ids = [id];
        try { ids.push(new mongoose.Types.ObjectId(id)); } catch {}
        return ids;
      });
      const contactsData = await Contacts_V5.find({ _id: { $in: searchIds } }).lean();
      const contactsMap = new Map(contactsData.map(c => [String(c._id), c]));
      const skippedCount = contactIds.length - contactsData.length;

      const bulkOps = itemsToSave.map((item) => {
        const contactId = typeof item === "object" && item._id ? item._id : String(item);
        const contactData = contactsMap.get(contactId);
        if (!contactData) {
          console.warn(`[SAVED CONTROLLER] ⚠️ Contact not found: ${contactId}`);
          return null;
        }
        return {
          insertOne: {
            document: { userId, contactId, contactData, listIds },
          },
        };
      }).filter(op => op !== null);

      const result = await SavedContacts.bulkWrite(bulkOps);

      res.status(200).json({
        message: "Items saved successfully",
        inserted: result.insertedCount,
        skipped: skippedCount,
      });
    } catch (error) {
      console.error("[SAVED CONTROLLER] ❌ Failed to save items:", {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
      res.status(500).json({ error: "Failed to save items" });
    }
  },

  // Get saved items for a user
  getList: async (req, res) => {
    try {
      // Multi-tenant: saved items belong to workspace owner
      const userId = req.workspaceOwner;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Fetch all saved contacts for the user
      const savedItems = await SavedContacts.find({ userId })
        .select("contactId contactData userId listIds createdAt updatedAt")
        .lean();

      // Backfill missing contactData from Contacts_V5 for items saved via
      // the batch/filters path (which may not have stored contactData).
      const missingIds = savedItems
        .filter(s => !s.contactData)
        .map(s => s.contactId)
        .filter(Boolean);

      if (missingIds.length > 0) {
        const bulkDocs = await Contacts_V5.find({ _id: { $in: missingIds } })
          .lean()
          .batchSize(5000);
        const docMap = new Map(bulkDocs.map(d => [String(d._id), d]));
        for (const item of savedItems) {
          if (!item.contactData && docMap.has(item.contactId)) {
            item.contactData = docMap.get(item.contactId);
          }
        }
      }

      const totalSavedItems = savedItems.length;

      res.status(200).json({
        data: savedItems,
        totalSavedItems,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get saved items" });
    }
  },

  // Delete saved items for a user
  deleteSavedItems: async (req, res) => {
    try {
      const userId = req.workspaceOwner;
      const { contactIds } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      if (!contactIds || contactIds.length === 0) {
        return res.status(400).json({ error: "Contact IDs are required" });
      }


      // Delete from SavedContacts by contactId (Elasticsearch ID)
      const savedContactsResult = await SavedContacts.deleteMany({
        userId,
        contactId: { $in: contactIds },
      });


      res.status(200).json({
        message: "All saved items removed successfully",
        deleted: savedContactsResult.deletedCount,
      });
    } catch (error) {
      console.error("[Delete Controller] Error:", error);
      res.status(500).json({ error: "Failed to delete saved items" });
    }
  },

  // Delete ALL saved items for a user
  deleteAllSavedItems: async (req, res) => {
    try {
      const userId = req.workspaceOwner;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Delete all saved contacts for this user from SavedContacts only
      const savedContactsResult = await SavedContacts.deleteMany({ userId });

      res.status(200).json({
        message: "All saved items removed successfully",
        deleted: savedContactsResult.deletedCount,
      });
    } catch (error) {
      console.error("[DeleteAll Controller] Error:", error);
      res.status(500).json({ error: "Failed to delete all saved items" });
    }
  },

};

module.exports = savedController;

// function to save or fetch list
async function createOrFetchLists(userId, listNames, type = "contacts") {
  // Fetch existing lists that match the list names for the given user
  const existingLists = await List.find({ userId, name: { $in: listNames }, type });

  // Get the names of the existing lists
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

  // Insert new lists into the database
  let insertedLists = [];
  if (newLists.length > 0) {
    insertedLists = await List.insertMany(newLists);
  }

  // Combine existing and newly created lists
  const allLists = [...existingLists, ...insertedLists];

  // Return both the existing and newly created lists
  return allLists;
}

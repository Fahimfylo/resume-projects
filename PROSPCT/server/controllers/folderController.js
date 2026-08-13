const Folder = require("../models/Folder");
const List = require("../models/List");

const folderController = {
  createFolder: async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Folder name is required" });
      }

      // Multi-tenant: scope folders to workspace owner
      const userId = req.workspaceOwner;
      const slug = name.replace(/\s+/g, "-").toLowerCase();

      const existing = await Folder.findOne({ userId, slug });
      if (existing) {
        return res.status(400).json({ message: "Folder already exists" });
      }

      const newFolder = new Folder({ userId, name, slug });
      await newFolder.save();

      res.status(200).json({ message: "Folder created", folder: newFolder });
    } catch (error) {
      console.error("Failed to create folder", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getFolders: async (req, res) => {
    try {
      // Multi-tenant: scope folders to workspace owner
      const userId = req.workspaceOwner;
      const folders = await Folder.find({ userId }).sort({ createdAt: -1 });
      res.status(200).json(folders);
    } catch (error) {
      console.error("Failed to fetch folders", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteFolder: async (req, res) => {
    try {
      // Multi-tenant: scope to workspace owner
      const userId = req.workspaceOwner;
      const { id } = req.params;

      const folder = await Folder.findOne({ _id: id, userId });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      // Remove folder reference from lists that were in this folder
      await List.updateMany({ folderId: folder._id, userId }, { $set: { folderId: null } });

      await folder.deleteOne();
      res.status(200).json({ message: "Folder deleted" });
    } catch (error) {
      console.error("Failed to delete folder", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = folderController;

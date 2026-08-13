const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // Store IDs of saved contacts (or other item IDs) that belong to this list
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SavedContacts",
      },
    ],
    // Optional folder this list belongs to
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    type: {
      type: String,
      enum: ["contacts", "companies"],
      default: "contacts",
    },
  },
  { timestamps: true }
);

// Add a compound index for uniqueness on userId, list name, and type
ListSchema.index({ userId: 1, slug: 1, type: 1 }, { unique: true });

const List = mongoose.model("List", ListSchema);

module.exports = List;

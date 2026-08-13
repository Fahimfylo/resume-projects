const mongoose = require("mongoose");

const FolderSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

// Ensure a user cannot create two folders with the same name
FolderSchema.index({ userId: 1, slug: 1 }, { unique: true });

const Folder = mongoose.model("Folder", FolderSchema);

module.exports = Folder;

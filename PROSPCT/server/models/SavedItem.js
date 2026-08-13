const mongoose = require("mongoose");

const savedItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contacts_v5",
      required: true,
    },
    listIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "List",
      },
    ],
  },
  { timestamps: true },
);

savedItemSchema.index({ userId: 1, contactId: 1 });

const SavedItem = mongoose.model("SavedItem", savedItemSchema, "savedcontacts");

module.exports = SavedItem;

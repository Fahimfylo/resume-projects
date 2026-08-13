const mongoose = require("mongoose");

const savedContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contactId: {
      type: String,
      required: true,
    },
    // Store full contact data directly
    contactData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    listIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "List",
      },
    ],
  },
  { timestamps: true }
);

savedContactSchema.index({ userId: 1 });
savedContactSchema.index({ userId: 1, contactId: 1 });

const SavedContacts = mongoose.model("SavedContacts", savedContactSchema);

module.exports = SavedContacts;

const mongoose = require("mongoose");

const savedCompanySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: String,
      required: true,
    },
    // Store full company data directly
    companyData: {
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

savedCompanySchema.index({ userId: 1 });

const SavedCompanies = mongoose.model("SavedCompanies", savedCompanySchema);

module.exports = SavedCompanies;

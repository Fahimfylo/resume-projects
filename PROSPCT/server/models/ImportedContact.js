const mongoose = require("mongoose");
const crypto = require("crypto");

const importedContactSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    
    importBatchId: {
      type: String,
      required: true,
    },
    
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    
    fileName: {
      type: String,
      required: true,
    },
    
    originalRowIndex: {
      type: Number,
    },
    
    originalRowData: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    contactData: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    email: {
      type: String,
    },
    
    status: {
      type: String,
      enum: ["pending", "processed", "duplicate", "failed"],
      default: "pending",
    },
    
    error: {
      type: String,
    },
    
    processedToContactsV5: {
      type: Boolean,
      default: false,
    },
    
    processedAt: {
      type: Date,
    },
    
    _index: { type: String, default: "contacts_imported" },
    _type: { type: String, default: "_doc" },
    _score: { type: Number, default: 1.0 },
  },
  { 
    collection: "contacts_imported",
    timestamps: true,
  }
);

const ImportedContact = mongoose.model("ImportedContact", importedContactSchema);

const importBatchSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    
    fileName: {
      type: String,
      required: true,
    },
    
    fileSize: {
      type: Number,
    },
    
    totalRows: {
      type: Number,
      default: 0,
    },
    
    validRows: {
      type: Number,
      default: 0,
    },
    
    failedRows: {
      type: Number,
      default: 0,
    },
    
    processedToContactsV5: {
      type: Number,
      default: 0,
    },
    
    status: {
      type: String,
      enum: ["uploading", "parsing", "validating", "importing", "completed", "failed"],
      default: "uploading",
    },
    
    error: {
      type: String,
    },
    
    rowErrors: {
      type: [String],
      default: [],
    },
  },
  { 
    collection: "import_batches",
    timestamps: true,
  }
);

const ImportBatch = mongoose.model("ImportBatch", importBatchSchema);

module.exports = { ImportedContact, ImportBatch };

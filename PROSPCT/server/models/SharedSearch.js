const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SharedSearchSchema = new Schema({
  shareId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  filters: {
    type: Object,
    required: true,
  },
  excludedFilters: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Auto-delete after 30 days
    expire: 2592000,
  },
});

const SharedSearch = mongoose.model("SharedSearch", SharedSearchSchema);
module.exports = SharedSearch;

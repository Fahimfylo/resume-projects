const mongoose = require("mongoose");

const companiesCacheSchema = new mongoose.Schema(
  {},
  { collection: "companies_cache", strict: false },
);

module.exports = mongoose.model("CompaniesCache", companiesCacheSchema);

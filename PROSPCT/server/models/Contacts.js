const mongoose = require("mongoose");

const contactsV5Schema = new mongoose.Schema(
  {
    _id: String,
    _index: String,
    _type: String,
    _score: Number,
    _source: mongoose.Schema.Types.Mixed,
  },
  { collection: "contacts_v5" },
);

// ── Focused indexes on ACTUAL query paths (snake_case) ────────────────────
// Each index adds write overhead + disk space on 61M docs (~2-5GB each).
// These match the toMongoPath() output in searchService.js.
//
// Keyword exact-match fields (used with $in)
contactsV5Schema.index({ "_source.person_email_status_cd": 1 }, { background: true });
contactsV5Schema.index({ "_source.organization_industries": 1 }, { background: true });
contactsV5Schema.index({ "_source.person_seniority": 1 }, { background: true });
contactsV5Schema.index({ "_source.person_location_country": 1 }, { background: true });
// Wildcard/prefix search fields (used with $regex ^)
contactsV5Schema.index({ "_source.organization_name": 1 }, { background: true });
contactsV5Schema.index({ "_source.person_email": 1 }, { background: true });
contactsV5Schema.index({ "_source.person_location_city": 1 }, { background: true });
contactsV5Schema.index({ "_source.person_title": 1 }, { background: true });
// Range fields
contactsV5Schema.index({ "_source.organization_num_current_employees": 1 }, { background: true });
contactsV5Schema.index({ "_source.organization_founded_year": 1 }, { background: true });
// Company/link fields
contactsV5Schema.index({ "_source.organization_domain": 1 }, { background: true });
// Postal code
contactsV5Schema.index({ "_source.person_location_postal_code": 1 }, { background: true });
// Email domain (exact $in match — dedicated indexed field for fast domain filtering)
contactsV5Schema.index({ "_source.person_email_domain": 1 }, { background: true });
// Keywords (prefix regex — usePrefix: true now enables index usage)
contactsV5Schema.index({ "_source.organization_keywords": 1 }, { background: true });
// Compound location index (city + state + country)
contactsV5Schema.index(
  { "_source.person_location_city": 1, "_source.person_location_state": 1, "_source.person_location_country": 1 },
  { background: true },
);
// Country + Seniority + Email status compound (common multi-filter combo)
contactsV5Schema.index(
  { "_source.person_location_country": 1, "_source.person_seniority": 1, "_source.person_email_status_cd": 1 },
  { background: true },
);
// Industry + Country compound (common industry + country filter)
contactsV5Schema.index(
  { "_source.organization_industries": 1, "_source.person_location_country": 1 },
  { background: true },
);
// Country + City compound (country + city without requiring state)
contactsV5Schema.index(
  { "_source.person_location_country": 1, "_source.person_location_city": 1 },
  { background: true },
);
// Country + Title compound (country + job title — the multi-filter timeout offender)
contactsV5Schema.index(
  { "_source.person_location_country": 1, "_source.person_title": 1 },
  { background: true },
);
// Job functions (nested path used by jobFunction filter)
contactsV5Schema.index({ "_source.job_functions.name": 1 }, { background: true });

module.exports = mongoose.model("Contacts_v5", contactsV5Schema);

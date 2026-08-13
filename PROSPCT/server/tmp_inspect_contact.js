require('dotenv').config();
const mongoose = require('mongoose');
const Contacts = require('./models/Contacts');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const doc = await Contacts.findOne().lean();
    if (!doc) {
      process.exit(0);
    }

    const src = doc._source || doc;

    const printKeys = (obj, max = 80) => {
      const keys = Object.keys(obj);
    };

    printKeys(src, 80);

    const fieldsToCheck = [
      'person_first_name',
      'person_last_name',
      'person_name',
      'person_title',
      'person_email',
      'person_email_status_cd',
      'person_email_status',
      'person_email_status_code',
      'person_phone',
      'person_linkedin_url',
      'person_location_city',
      'person_location_state',
      'person_location_country',
      'gender',
      'organization_name',
      'organization_linkedin_url',
      'organization_linkedin_numerical_urls',
      'organization_industry',
      'organization_industries',
      'organization_relevant_keywords_str',
      'organization_num_current_employees',
      'organization_location_city',
      'organization_location_state',
      'organization_location_country',
      'organization_location_postal_code',
      'organization_founded_year',
      'organization_short_description',
      'revenueRange',
      'organization_revenue_range',
      // additional candidates:
      'organization_location_postalcode',
      'organization_location_zip',
      'company_location_city',
      'company_city',
      'company_state',
      'company_postal_code',
      'company_zip',
    ];

    fieldsToCheck.forEach((f) => {
    });

    // Also show nested objects if any
    const nestedKeys = ['organization_location', 'company_location', 'location'];
    nestedKeys.forEach((nk) => {
      if (src[nk]) {
      }
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
})();

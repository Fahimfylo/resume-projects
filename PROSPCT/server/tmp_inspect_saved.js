require('dotenv').config();
const mongoose = require('mongoose');
const SavedContacts = require('./models/SavedContacts');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const item = await SavedContacts.findOne().lean();
    if (!item) {
      process.exit(0);
    }
    if (item.listIds) {
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

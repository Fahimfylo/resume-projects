const mongoose = require("mongoose");
const Contacts_V5 = require("../../server/models/Contacts");

mongoose.connect("00", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const loadTestData = async () => {
  try {

    const results = await Contacts_V5.find({}).limit(100).lean().exec();

    console.dir(results.slice(0, 5), { depth: null, colors: true });

    const tableData = results.map((item) => ({
      ID: item._id,
      Name: item._source?.person_name || "Not Available",
      Title: item._source?.person_title || "Not Available",
      Organization: item._source?.organization_name || "Not Available",
    }));
    console.table(tableData);

    process.exit(0);
  } catch (error) {
    console.error("Error loading initial data:", error);
    process.exit(1);
  }
};

loadTestData();

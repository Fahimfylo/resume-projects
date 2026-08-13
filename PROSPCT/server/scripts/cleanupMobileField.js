/**
 * Cleanup Script: Remove old 'mobile' field from database
 * This script removes the deprecated 'mobile' field from all collections
 * 
 * Usage: node scripts/cleanupMobileField.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env file");
  process.exit(1);
}

const main = async () => {

  try {
    await mongoose.connect(MONGODB_URI);

    const collections = ['users', 'accounts', 'admins', 'teams'];
    let totalRemoved = 0;

    for (const collection of collections) {
      
      const result = await mongoose.connection.db.collection(collection).updateMany(
        { $or: [{ mobile: { $exists: true } }, { phone: { $exists: true } }] },
        { $unset: { mobile: "", phone: "" } }
      );

      if (result.modifiedCount > 0) {
        totalRemoved += result.modifiedCount;
      } else {
      }
    }


  } catch (error) {
    console.error("\n❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

main();

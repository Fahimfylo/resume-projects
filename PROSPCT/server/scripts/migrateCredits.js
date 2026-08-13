/**
 * Data Migration Script: Migrate existing credit balances to new schema
 * 
 * This script migrates the old `current` credit field to the new `freeBalance` 
 * and `purchasedBalance` structure.
 * 
 * Migration Strategy:
 * - current -> freeBalance (to be safe, assume all existing credits are "free")
 * - purchasedBalance = 0 (new field, starts at 0)
 * 
 * Usage: node server/scripts/migrateCredits.js
 */

const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

async function migrateCredits() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({});

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if user has old schema (current field exists)
        const hasOldSchema = 
          user.credits?.emailCredits?.current !== undefined ||
          user.credits?.phoneCredits?.current !== undefined ||
          user.credits?.verificationCredits?.current !== undefined ||
          user.credits?.exportCredits?.current !== undefined;

        if (!hasOldSchema) {
          continue;
        }

        // Migrate each credit type
        const updateFields = {};
        
        // Email Credits
        if (user.credits?.emailCredits?.current !== undefined) {
          updateFields["credits.emailCredits.freeBalance"] = user.credits.emailCredits.current;
          updateFields["credits.emailCredits.purchasedBalance"] = 0;
        }
        
        // Phone Credits
        if (user.credits?.phoneCredits?.current !== undefined) {
          updateFields["credits.phoneCredits.freeBalance"] = user.credits.phoneCredits.current;
          updateFields["credits.phoneCredits.purchasedBalance"] = 0;
        }
        
        // Verification Credits
        if (user.credits?.verificationCredits?.current !== undefined) {
          updateFields["credits.verificationCredits.freeBalance"] = user.credits.verificationCredits.current;
          updateFields["credits.verificationCredits.purchasedBalance"] = 0;
        }
        
        // Export Credits
        if (user.credits?.exportCredits?.current !== undefined) {
          updateFields["credits.exportCredits.freeBalance"] = user.credits.exportCredits.current;
          updateFields["credits.exportCredits.purchasedBalance"] = 0;
        }

        // Remove old 'current' field by setting to undefined (MongoDB will remove it)
        updateFields["credits.emailCredits.current"] = undefined;
        updateFields["credits.phoneCredits.current"] = undefined;
        updateFields["credits.verificationCredits.current"] = undefined;
        updateFields["credits.exportCredits.current"] = undefined;

        await User.findByIdAndUpdate(user._id, { $set: updateFields });
        
        migratedCount++;

      } catch (userError) {
        errorCount++;
        console.error(`✗ Failed to migrate user ${user._id}:`, userError.message);
      }
    }


  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration
migrateCredits();

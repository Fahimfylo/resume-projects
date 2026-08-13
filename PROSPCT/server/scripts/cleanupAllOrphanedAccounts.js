/**
 * 🧹 NUCLEAR CLEANUP: Remove ALL unverified accounts (IMMEDIATE)
 * 
 * ⚠️ WARNING: This script IMMEDIATELY deletes ALL unverified accounts
 * regardless of when they were created. Use with caution!
 * 
 * Use when:
 * - You want to clean up all failed registration attempts NOW
 * - You need a fresh start with email verification
 * - Testing and development cleanup
 * 
 * Usage: node scripts/cleanupAllOrphanedAccounts.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/prospct");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const cleanupAllUnverified = async () => {
  try {
    const Account = require("../models/Account");
    const User = require("../models/User");
    const Subscription = require("../models/Subscription");

    let totalDeleted = 0;

    // ======================================
    // 1️⃣ Clean Account model - ALL unverified
    // ======================================
    
    const unverifiedAccounts = await Account.find({
      isVerified: false,
    });

    if (unverifiedAccounts.length === 0) {
    } else {
      
      for (const account of unverifiedAccounts) {
        
        // Delete associated subscription
        if (account.subscription) {
          await Subscription.findByIdAndDelete(account.subscription);
        }
        
        // Delete account
        await Account.findByIdAndDelete(account._id);
      }
      
      totalDeleted += unverifiedAccounts.length;
    }

    // ======================================
    // 2️⃣ Info about User model
    // ======================================
    const userCount = await User.countDocuments();

    // ======================================
    // Summary
    // ======================================
    
  } catch (error) {
    console.error("❌ Cleanup error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

// Run cleanup with warning

setTimeout(() => {
  connectDB().then(cleanupAllUnverified);
}, 3000);

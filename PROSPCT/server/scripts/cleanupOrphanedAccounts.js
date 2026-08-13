/**
 * 🧹 COMPREHENSIVE CLEANUP SCRIPT: Remove orphaned accounts from BOTH models
 * 
 * Removes unverified accounts that were created more than 1 hour ago
 * These are leftover accounts from failed registration attempts
 * 
 * Handles:
 * - Account model: unverified accounts (from authControllerUnified.js)
 * - User model: accounts without password verification (from legacy addUser)
 * 
 * Usage: node scripts/cleanupOrphanedAccounts.js
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

const cleanupOrphanedAccounts = async () => {
  try {
    const Account = require("../models/Account");
    const User = require("../models/User");
    const Subscription = require("../models/Subscription");

    let totalDeleted = 0;

    // ======================================
    // 1️⃣ Clean up Account model (unified)
    // ======================================
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const orphanedAccounts = await Account.find({
      isVerified: false,
      createdAt: { $lt: oneHourAgo },
    });

    if (orphanedAccounts.length === 0) {
    } else {
      
      for (const account of orphanedAccounts) {
        
        // Delete associated subscription
        if (account.subscription) {
          await Subscription.findByIdAndDelete(account.subscription);
        }
        
        // Delete account
        await Account.findByIdAndDelete(account._id);
      }
      
      totalDeleted += orphanedAccounts.length;
    }

    // ======================================
    // 2️⃣ Clean up User model (legacy)
    // ======================================
    
    const orphanedUsers = await User.find({
      createdAt: { $lt: oneHourAgo },
    }).select("email createdAt");

    if (orphanedUsers.length === 0) {
    } else {
      
      for (const user of orphanedUsers) {
        
        // Delete associated subscription
        if (user.subscription) {
          await Subscription.findByIdAndDelete(user.subscription);
        }
        
        // Delete user
        await User.findByIdAndDelete(user._id);
      }
      
      totalDeleted += orphanedUsers.length;
    }

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

// Run cleanup
connectDB().then(cleanupOrphanedAccounts);

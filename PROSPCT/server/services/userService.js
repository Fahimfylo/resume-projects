// services/userService.js

const User = require("../models/User");
const CreditLedger = require("../models/CreditLedger");
const Plan = require("../models/Plans");
const Team = require("../models/Team");
const { manageUserSubscription } = require("./subscriptionService");
const mongoose = require("mongoose");

const CREDIT_TYPES = {
  EMAIL: "emailCredits",
  PHONE: "phoneCredits",
  VERIFICATION: "verificationCredits",
  EXPORT: "exportCredits",
};

const CREDIT_TYPE_ENUM = {
  emailCredits: "EMAIL",
  phoneCredits: "PHONE",
  verificationCredits: "VERIFICATION",
  exportCredits: "EXPORT",
};

async function upgradeUserPlan(userId, planId, billingCycle) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const user = await User.findById(userId).session(session);
    const plan = await Plan.findById(planId).session(session);

    if (!user || !plan) {
      await session.abortTransaction();
      throw new Error("User or Plan not found");
    }

    // Ledger entries for plan upgrade credit additions
    const ledgerEntries = [];
    
    // Update credits based on the plan features
    updateCreditsWithLedger(user.credits.emailCredits, plan.features.emailCredits, ledgerEntries, userId, "emailCredits");
    updateCreditsWithLedger(user.credits.phoneCredits, plan.features.phoneCredits, ledgerEntries, userId, "phoneCredits");
    updateCreditsWithLedger(user.credits.verificationCredits, plan.features.verificationCredits, ledgerEntries, userId, "verificationCredits");
    
    if (plan.features.exportCredits) {
      updateCreditsWithLedger(user.credits.exportCredits, plan.features.exportCredits, ledgerEntries, userId, "exportCredits");
    }

    // Copy feature limits from plan to user
    user.limits = { ...plan.features?.limits };

    // Set the new plan and subscription
    user.plan = planId;
    
    // Handle subscription tracking
    const subscription = await manageUserSubscription(
      userId,
      planId,
      new Date(),
      billingCycle
    );
    user.subscription = subscription._id;

    // Save the updated user document within transaction
    await user.save({ session });
    
    // Record ledger entries
    if (ledgerEntries.length > 0) {
      await CreditLedger.insertMany(ledgerEntries, { session });
    }

    await session.commitTransaction();

    // Sync team maxUsers from plan (outside transaction — non-critical)
    try {
      const team = await Team.findOne({ owner: userId });
      if (team) {
        team.maxUsers = plan.maxUsers || 1;
        await team.save();
      }
    } catch (teamErr) {
      console.error("Failed to sync team maxUsers:", teamErr.message);
    }

    return {
      success: true,
      message: "User plan updated successfully",
      user,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error upgrading user plan:", error);
    return {
      success: false,
      message: "Failed to upgrade user plan",
      error,
    };
  } finally {
    session.endSession();
  }
}

async function upgradeUserCredits(userId, creditType, quantity, referenceId = null, metadata = {}) {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const fieldName = CREDIT_TYPES[creditType.toUpperCase()];
    if (!fieldName) {
      await session.abortTransaction();
      throw new Error("Unknown credit type");
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      throw new Error("User not found");
    }

    const oldBalance = user.credits[fieldName].current || 0;
    
    // Atomic increment of current and max
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { 
        $inc: { 
          [`credits.${fieldName}.current`]: quantity,
          [`credits.${fieldName}.max`]: quantity 
        } 
      },
      { new: true, session, runValidators: true }
    );

    if (!updatedUser) {
      await session.abortTransaction();
      throw new Error("Failed to update user credits");
    }

    // Record in CreditLedger
    await CreditLedger.create([{
      userId,
      creditType: CREDIT_TYPE_ENUM[fieldName],
      transactionType: "PURCHASE",
      amount: quantity,
      balanceAfter: oldBalance + quantity,
      balanceType: "TOTAL",
      referenceId,
      metadata: { ...metadata, previousBalance: oldBalance },
      createdAt: new Date()
    }], { session });

    await session.commitTransaction();

    return {
      success: true,
      message: `${creditType} upgraded successfully.`,
      user: updatedUser,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error upgrading user credits:", error);
    return { success: false, message: "Failed to upgrade user credits", error };
  } finally {
    session.endSession();
  }
}

module.exports = { upgradeUserPlan, upgradeUserCredits };

function updateCreditsWithLedger(userCredits, planCredits, ledgerEntries, userId, creditField) {
  if (planCredits && planCredits.max !== undefined) {
    const oldCurrent = userCredits.current || 0;
    const oldMax = userCredits.max || 0;
    const newMax = planCredits.max;
    
    // Bank account model: remaining credits from old plan are added to new plan allocation
    userCredits.current = oldCurrent + newMax;
    userCredits.max = oldMax + newMax;
    
    // Record ledger entry for plan upgrade credit addition
    ledgerEntries.push({
      userId,
      creditType: CREDIT_TYPE_ENUM[creditField],
      transactionType: "PLAN_UPGRADE",
      amount: newMax,
      balanceAfter: userCredits.current,
      balanceType: "TOTAL",
      metadata: { 
        previousBalance: oldCurrent,
        previousMax: oldMax,
        planMax: newMax,
        newMax: userCredits.max
      },
      createdAt: new Date()
    });
  }
}

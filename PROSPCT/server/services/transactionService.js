const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const CreditLedger = require("../models/CreditLedger");
const mongoose = require("mongoose");

const { upgradeUserPlan, upgradeUserCredits } = require("./userService");

const transactionService = {
  //Initialize a transaction

  createTransaction: async ({ userId, totalAmount, paymentGateway, items, coupon }) => {
    const purchaseType = transactionService.determineTransactionType(items);
  
    // Create the transaction items from the provided product data
    const transactionItems = items
      .map((item) => {
        if (item.type === "Plan") {
          return {
            plan: {
              name: item.name,
              planId: item.planId,
              price: item.price,
              billingCycle: item.billingCycle || "monthly",
              quantity: item.quantity || 1,
            },
          };
        } else if (item.type === "Credit") {
          return {
            credit: {
              name: item.name,
              quantity: item.quantity,
              packagePrice: item.price,
            },
          };
        }
        return null; // Skip any items that don't match
      })
      .filter((item) => item !== null); // Remove null entries
  
    // Create the transaction document
    const transaction = new Transaction({
      userId,
      type: purchaseType,
      totalAmount,
      items: transactionItems,
      paymentGateway: {
        name: paymentGateway,
      },
      status: "PENDING",
      coupon: coupon ? { code: coupon.code, discountPercentage: coupon.discountPercentage } : null,
    });
  
    // Save the transaction to the database
    return await transaction.save();
  },
  

  updateTransactionStatus: async (transactionId, status, responseData) => {
    // ── Optimistic Update ──
    // Only update if the transaction is NOT already 'COMPLETED'.
    // This prevents race conditions where a late-arriving webhook
    // could overwrite the canonical 'COMPLETED' state or re-trigger benefits.
    const transaction = await Transaction.findOneAndUpdate(
      { _id: transactionId, status: { $ne: "COMPLETED" } },
      {
        status,
        "paymentGateway.responseData": responseData,
      },
      { new: true }
    );
    return transaction;
  },

  //Apply transaction benefit with ACID transaction support
  applyTransactionBenefits: async (userId, transaction) => {
    // Check if transaction has already been processed
    if (transaction.status !== "COMPLETED") {
      return;
    }

    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error("User not found");
      }

      const ledgerEntries = [];

      // Handle plan upgrades
      if (
        transaction.type === "PLAN_UPGRADE" ||
        transaction.type === "PLAN & CREDIT PURCHASE"
      ) {
        const planItem = transaction.items.find((item) => item?.plan);
        if (planItem) {
          const { planId, billingCycle } = planItem.plan;
          // Note: upgradeUserPlan now handles its own transaction internally
          // We call it without session and let it manage its own ACID boundaries
          await upgradeUserPlan(userId, planId, billingCycle);
        }
      }

      // Handle credit purchases
      if (
        transaction.type === "CREDIT_PURCHASE" ||
        transaction.type === "PLAN & CREDIT PURCHASE"
      ) {
        const creditItems = transaction.items.filter(
          (item) =>
            item?.credit?.quantity && typeof item.credit.quantity === "number"
        );

        for (const item of creditItems) {
          const creditType = "verification"; // Default type for purchased credits
          const quantity = item.credit.quantity;
          
          const fieldName = `${creditType}Credits`;
          const oldBalance = user.credits[fieldName].current || 0;
          
          // Atomic increment
          await User.findOneAndUpdate(
            { _id: userId },
            { 
              $inc: { 
                [`credits.${fieldName}.current`]: quantity,
                [`credits.${fieldName}.max`]: quantity 
              } 
            },
            { session, runValidators: true }
          );

          // Record ledger entry
          ledgerEntries.push({
            userId,
            creditType: "VERIFICATION",
            transactionType: "PURCHASE",
            amount: quantity,
            balanceAfter: oldBalance + quantity,
            balanceType: "TOTAL",
            referenceId: transaction._id.toString(),
            metadata: { 
              transactionType: transaction.type,
              itemName: item.credit.name,
              previousBalance: oldBalance 
            },
            createdAt: new Date()
          });
        }
      }

      // Save ledger entries
      if (ledgerEntries.length > 0) {
        await CreditLedger.insertMany(ledgerEntries, { session });
      }

      await session.commitTransaction();

      const updatedUser = await User.findById(userId).session(session);
      return updatedUser;
    } catch (error) {
      await session.abortTransaction();
      console.error("Error applying transaction benefits:", error);
      throw new Error(`Failed to apply transaction benefits: ${error.message}`);
    } finally {
      session.endSession();
    }
  },

  // Determine the type of transaction based on items
  determineTransactionType: (items) => {
    const hasPlan = items.some((item) => item.type === "Plan");
    const hasCredit = items.some((item) => item.type === "Credit");

    if (hasPlan && hasCredit) {
      return "PLAN & CREDIT PURCHASE";
    }
    if (hasPlan) {
      return "PLAN_UPGRADE";
    }
    if (hasCredit) {
      return "CREDIT_PURCHASE";
    }
    return null; // Or throw an error if needed
  },

  /**
   * Atomically synchronize Subscription and User documents
   * when FastSpring fires a subscription lifecycle event.
   *
   * @param {string} userId  - MongoDB User ObjectId
   * @param {object} event   - processed event returned by processWebhookEvent
   */
  syncSubscriptionState: async (userId, event) => {
    try {
      const { status, subscriptionId, metadata } = event;

      if (!subscriptionId) return;

      // Build an atomic update payload for the Subscription document
      const subscriptionUpdate = {
        "gateway.status": status,
        "gateway.responseData": metadata,
        updatedAt: new Date(),
      };

      // Map internal status to subscription active flag
      const isActive = status === "COMPLETED" || status === "TRIALING";
      subscriptionUpdate.isActive = isActive;

      if (status === "CANCELLED") {
        subscriptionUpdate.cancelledAt = new Date();
      }

      // Atomic upsert on Subscription
      const subscription = await Subscription.findOneAndUpdate(
        { "gateway.subscriptionId": subscriptionId },
        { $set: subscriptionUpdate },
        { new: true, upsert: false } // do NOT create phantom subscriptions
      );

      if (!subscription) {
        console.warn(
          `[syncSubscriptionState] No Subscription found for gateway subscriptionId: ${subscriptionId}`
        );
        return;
      }

      // Reflect active status on User document (single atomic write)
      await User.findByIdAndUpdate(
        userId,
        { $set: { "subscription.isActive": isActive } },
        { new: true }
      );

    } catch (error) {
      console.error("[syncSubscriptionState] Error:", error.message);
      throw error;
    }
  },
};

module.exports = transactionService;

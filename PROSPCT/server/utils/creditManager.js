const User = require("../models/User");

/**
 * Credit Management Utility
 *
 * ALL credit operations MUST go through this utility.
 * Credits are ALWAYS deducted from/added to the workspace owner.
 * Members NEVER have their own credits modified.
 *
 * Usage in controllers:
 *   const credits = require("../utils/creditManager");
 *   await credits.deduct(req.workspaceOwner, "email", 1);
 */
const creditManager = {
  /**
   * Deduct credits from the workspace owner.
   *
   * @param {string|ObjectId} workspaceOwnerId - The workspace owner's User _id
   * @param {string} creditType - One of: "email", "phone", "verification", "export"
   * @param {number} amount - Number of credits to deduct (positive integer)
   * @returns {Object} { success: boolean, remaining: number, message?: string }
   */
  deduct: async (workspaceOwnerId, creditType, amount = 1) => {
    const fieldMap = {
      email: "emailCredits",
      phone: "phoneCredits",
      verification: "verificationCredits",
      export: "exportCredits",
    };

    const creditField = fieldMap[creditType];
    if (!creditField) {
      return { success: false, remaining: 0, message: `Invalid credit type: ${creditType}` };
    }

    const owner = await User.findById(workspaceOwnerId).select(`credits.${creditField}`);
    if (!owner) {
      return { success: false, remaining: 0, message: "Workspace owner not found" };
    }

    const creditObj = owner.credits[creditField];
    if (!creditObj) {
      return { success: false, remaining: 0, message: "Credit field not found" };
    }

    if (creditObj.current < amount) {
      return {
        success: false,
        remaining: creditObj.current,
        message: "Insufficient credits",
      };
    }

    creditObj.current -= amount;
    await owner.save();

    return { success: true, remaining: creditObj.current };
  },

  /**
   * Add credits to the workspace owner.
   */
  add: async (workspaceOwnerId, creditType, amount = 1) => {
    const fieldMap = {
      email: "emailCredits",
      phone: "phoneCredits",
      verification: "verificationCredits",
      export: "exportCredits",
    };

    const creditField = fieldMap[creditType];
    if (!creditField) {
      return { success: false, remaining: 0, message: `Invalid credit type: ${creditType}` };
    }

    const owner = await User.findById(workspaceOwnerId).select(`credits.${creditField}`);
    if (!owner) {
      return { success: false, remaining: 0, message: "Workspace owner not found" };
    }

    const creditObj = owner.credits[creditField];
    creditObj.current += amount;
    // Cap at max
    if (creditObj.current > creditObj.max) {
      creditObj.current = creditObj.max;
    }
    await owner.save();

    return { success: true, remaining: creditObj.current };
  },

  /**
   * Get credits for a workspace (always returns owner's credits).
   */
  getCredits: async (workspaceOwnerId) => {
    const owner = await User.findById(workspaceOwnerId)
      .select("credits")
      .populate("plan", "name features");

    if (!owner) {
      return null;
    }

    return {
      credits: owner.credits,
      plan: owner.plan,
    };
  },

  /**
   * Check if workspace has enough credits (without deducting).
   */
  hasCredits: async (workspaceOwnerId, creditType, amount = 1) => {
    const fieldMap = {
      email: "emailCredits",
      phone: "phoneCredits",
      verification: "verificationCredits",
      export: "exportCredits",
    };

    const creditField = fieldMap[creditType];
    if (!creditField) return false;

    const owner = await User.findById(workspaceOwnerId).select(`credits.${creditField}`);
    if (!owner) return false;

    return (owner.credits[creditField]?.current || 0) >= amount;
  },
};

module.exports = creditManager;

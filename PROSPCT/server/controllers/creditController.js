const User = require("../models/User");
const CreditLedger = require("../models/CreditLedger");
const mongoose = require("mongoose");
const { getIO } = require("../utils/socket");

const CREDIT_TYPE_MAP = {
  email: "emailCredits",
  phone: "phoneCredits",
  export: "exportCredits",
  verification: "verificationCredits",
};

const CREDIT_TYPE_ENUM = {
  email: "EMAIL",
  phone: "PHONE",
  export: "EXPORT",
  verification: "VERIFICATION",
};

const creditsController = {
  /**
   * Deduct credits atomically with race-condition protection
   * Uses MongoDB $gte check in query to prevent negative balances
   * Records all transactions in CreditLedger for audit trail
   * Compatible with standalone MongoDB (no replica set required)
   */
  deductCredits: async (req, res) => {
    // CRITICAL: Always deduct from workspace owner, never from member account
    const userId = req.workspaceOwner;

    try {
      let { type, quantity = 1, metadata = {} } = req.body;

      // 1. STRICT VALIDATION: Prevent negative balance exploit
      quantity = parseInt(quantity, 10);
      if (!userId || !type || isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
        console.warn(`[CREDIT DEDUCTION] ⚠️ Invalid params: userId=${userId}, type=${type}, quantity=${quantity}`);
        return res.status(400).json({ 
          error: "INVALID_PARAMETERS",
          message: "Invalid parameters. Quantity must be a positive integer." 
        });
      }

      const creditField = CREDIT_TYPE_MAP[type];
      const creditEnum = CREDIT_TYPE_ENUM[type];
      
      if (!creditField) {
        console.warn(`[CREDIT DEDUCTION] ⚠️ Unknown credit type: ${type}`);
        return res.status(400).json({ 
          error: "INVALID_CREDIT_TYPE",
          message: "Invalid credit type" 
        });
      }

      // 2. ADVISORY BALANCE CHECK (not atomic — the atomic check is in findOneAndUpdate $gte)
      const user = await User.findById(userId).select(`credits.${creditField}`);
      if (!user) {
        console.warn(`[CREDIT DEDUCTION] ⚠️ User not found: ${userId}`);
        return res.status(404).json({ 
          error: "USER_NOT_FOUND",
          message: "User not found" 
        });
      }

      const currentBalance = user.credits[creditField]?.current || 0;

      if (currentBalance < quantity) {
        console.warn(`[CREDIT DEDUCTION] ⚠️ Insufficient funds: type=${type}, have=${currentBalance}, need=${quantity}`);
        return res.status(400).json({ 
          error: "INSUFFICIENT_FUNDS",
          message: "Insufficient credits",
          details: {
            required: quantity,
            available: currentBalance,
            shortfall: quantity - currentBalance,
            type: type
          }
        });
      }

      // 3. ATOMIC DEDUCTION with $gte race-condition protection
      // findOneAndUpdate is atomic at the document level — the $gte ensures
      // we never go negative even under concurrent requests
      const fieldPath = `credits.${creditField}.current`;
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, [fieldPath]: { $gte: quantity } },
        { $inc: { [fieldPath]: -quantity } },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        console.warn(`[CREDIT DEDUCTION] ⚠️ Concurrent conflict: userId=${userId}, fieldPath=${fieldPath}, quantity=${quantity}`);
        return res.status(400).json({ 
          error: "CONCURRENT_CONFLICT",
          message: "Concurrent transaction conflict or balance changed. Please retry." 
        });
      }

      // 4. RECORD IN LEDGER (Audit Trail) — best-effort after atomic deduction
      const newBalance = updatedUser.credits[creditField].current;
      try {
        await CreditLedger.create({
          userId,
          creditType: creditEnum,
          transactionType: "DEDUCTION",
          amount: -quantity,
          balanceAfter: newBalance,
          balanceType: "TOTAL",
          metadata: { ...metadata, totalDeducted: quantity },
          createdAt: new Date()
        });
      } catch (ledgerError) {
        console.error(`[CREDIT DEDUCTION] ⚠️ Ledger write failed (deduction succeeded):`, ledgerError.message);
      }

      res.status(200).json({ 
        message: "Credits deducted successfully", 
        deducted: {
          total: quantity
        },
        remaining: {
          current: newBalance,
          total: newBalance
        },
        credits: updatedUser.credits
      });

    } catch (error) {
      console.error(`[CREDIT DEDUCTION] ❌ Error:`, {
        message: error.message,
        code: error.code,
        codeName: error.codeName,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
      res.status(500).json({ 
        error: "INTERNAL_ERROR",
        message: "Something went wrong during credit deduction." 
      });
    }
  },

  /**
   * Get user credit balances with ledger history
   */
  getCredits: async (req, res) => {
    try {
      // Credits belong to workspace owner - members see owner's credits
      const userId = req.workspaceOwner;
      const { type, limit = 50 } = req.query;

      const user = await User.findById(userId).select("credits");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build response with simplified structure
      const response = {
        email: {
          current: user.credits.emailCredits.current || 0,
          total: user.credits.emailCredits.current || 0,
          max: user.credits.emailCredits.max
        },
        phone: {
          current: user.credits.phoneCredits.current || 0,
          total: user.credits.phoneCredits.current || 0,
          max: user.credits.phoneCredits.max
        },
        verification: {
          current: user.credits.verificationCredits.current || 0,
          total: user.credits.verificationCredits.current || 0,
          max: user.credits.verificationCredits.max
        },
        export: {
          current: user.credits.exportCredits.current || 0,
          total: user.credits.exportCredits.current || 0,
          max: user.credits.exportCredits.max
        }
      };

      // Optionally fetch recent ledger entries
      let ledgerHistory = null;
      if (type && CREDIT_TYPE_ENUM[type]) {
        ledgerHistory = await CreditLedger.find({
          userId,
          creditType: CREDIT_TYPE_ENUM[type]
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .select("-__v");
      }

      res.status(200).json({
        credits: type ? response[type] : response,
        ledgerHistory: ledgerHistory || undefined
      });

    } catch (error) {
      console.error("[GET CREDITS ERROR]", error);
      res.status(500).json({ error: "Failed to fetch credits" });
    }
  },

  /**
   * Get historical credit balances by rolling back ledger transactions
   * from the current real-time balance.
   */
  getUsageHistory: async (req, res) => {
    try {
      // Usage history belongs to workspace owner
      const userId = req.workspaceOwner;
      const { endDate } = req.query;
      
      const user = await User.findById(userId).select("credits");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const end = endDate ? new Date(endDate) : new Date();
      end.setUTCHours(23, 59, 59, 999);
      
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 6); // 7 days total window (endDate - 6 days)
      start.setUTCHours(0, 0, 0, 0);

      // Fetch all ledgers within the 7 day window
      const ledgers = await CreditLedger.find({
        userId,
        createdAt: { $gte: start, $lte: end }
      }).sort({ createdAt: 1 });

      const dailyChanges = {};
      ledgers.forEach(l => {
        const dateStr = l.createdAt.toISOString().split('T')[0];
        if (!dailyChanges[dateStr]) {
          dailyChanges[dateStr] = { email: 0, phone: 0, export: 0 };
        }
        // Deductions are negative amounts in ledger, so we take absolute value for usage
        if (l.creditType === "EMAIL" && l.amount < 0) dailyChanges[dateStr].email += Math.abs(l.amount);
        else if (l.creditType === "PHONE" && l.amount < 0) dailyChanges[dateStr].phone += Math.abs(l.amount);
        else if (l.creditType === "EXPORT" && l.amount < 0) dailyChanges[dateStr].export += Math.abs(l.amount);
      });

      // Reconstruct exactly 7 days backwards from `endDate`
      const history = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        // Record the daily usage (credits consumed)
        history.unshift({
          date: dateStr,
          email: dailyChanges[dateStr]?.email || 0,
          phone: dailyChanges[dateStr]?.phone || 0,
          export: dailyChanges[dateStr]?.export || 0
        });
      }

      res.status(200).json(history);

    } catch (error) {
      console.error("[GET USAGE HISTORY ERROR]", error);
      res.status(500).json({ error: "Failed to fetch usage history" });
    }
  }
};

module.exports = creditsController;

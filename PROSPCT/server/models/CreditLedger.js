const mongoose = require("mongoose");

const creditLedgerSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    index: true 
  },
  creditType: { 
    type: String, 
    enum: ["EMAIL", "PHONE", "EXPORT", "VERIFICATION"], 
    required: true 
  },
  transactionType: { 
    type: String, 
    enum: ["DEDUCTION", "PURCHASE", "FREE_REFILL", "REFUND", "MANUAL_ADJUSTMENT", "PLAN_UPGRADE"], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  }, // Negative integers for deductions, Positive for additions
  balanceAfter: { 
    type: Number, 
    required: true 
  }, // The state of the balance exactly after this ledger entry
  balanceType: {
    type: String,
    enum: ["TOTAL"],
    default: "TOTAL",
    required: true
  }, // Whether this affected total/current credits
  referenceId: { 
    type: String 
  }, // e.g., the FastSpring tx_id, or the specific api feature feature code
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  }, // Arbitrary data like: "Exported 500 LinkedIn contacts"
  createdAt: { 
    type: Date, 
    default: Date.now, 
    immutable: true 
  }
});

// Index for efficient queries by user and date
creditLedgerSchema.index({ userId: 1, createdAt: -1 });
creditLedgerSchema.index({ userId: 1, creditType: 1, createdAt: -1 });

module.exports = mongoose.model("CreditLedger", creditLedgerSchema);

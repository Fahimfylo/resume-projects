const mongoose = require("mongoose");

const specialDealRedemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialDeal",
      required: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "suspended", "rejected"],
      default: "pending",
    },
    credits: {
      emailCredits: { type: Number, default: 0 },
      phoneCredits: { type: Number, default: 0 },
      verificationCredits: { type: Number, default: 0 },
      exportCredits: { type: Number, default: 0 },
      emailSeats: { type: Number, default: 0 },
    },
    approvedAt: { type: Date },
    suspendedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SpecialDealRedemption", specialDealRedemptionSchema);

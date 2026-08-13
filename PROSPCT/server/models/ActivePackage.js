const mongoose = require("mongoose");

const activePackageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", required: true },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: "SpecialDeal", required: true },
    activatedAt: { type: Date, default: Date.now },
    nextRenewalAt: { type: Date, required: true, index: true },
    lastRenewedAt: { type: Date },
    renewalPeriod: { type: Number, default: 0 },
    creditsPerRenewal: {
      emailCredits: { type: Number, default: 0 },
      phoneCredits: { type: Number, default: 0 },
      verificationCredits: { type: Number, default: 0 },
      exportCredits: { type: Number, default: 0 },
      emailSeats: { type: Number, default: 0 },
    },
    status: { type: String, enum: ["active", "paused", "cancelled"], default: "active" },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivePackage", activePackageSchema);

const mongoose = require("mongoose");

const voucherRedemptionLogSchema = new mongoose.Schema(
  {
    voucherCode: { type: String, required: true },
    voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, default: "" },
    status: { type: String, enum: ["success", "failed"], required: true },
    source: { type: String, enum: ["redeem", "register-and-redeem", "validate", "auto-renewal"], default: "redeem" },
    credits: {
      emailCredits: { type: Number, default: 0 },
      phoneCredits: { type: Number, default: 0 },
      verificationCredits: { type: Number, default: 0 },
      exportCredits: { type: Number, default: 0 },
      emailSeats: { type: Number, default: 0 },
    },
    errorMessage: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VoucherRedemptionLog", voucherRedemptionLogSchema);

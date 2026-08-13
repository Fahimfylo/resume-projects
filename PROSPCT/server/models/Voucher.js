const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    voucherCode: { type: String, required: true, unique: true },
    redeemToken: { type: String, unique: true, sparse: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    buyerEmail: { type: String },
    quantity: { type: Number, default: 1, min: 1 },
    perRedeemCredits: {
      emailCredits: { type: Number, default: 0 },
      phoneCredits: { type: Number, default: 0 },
      verificationCredits: { type: Number, default: 0 },
      exportCredits: { type: Number, default: 0 },
      emailSeats: { type: Number, default: 0 },
    },
    expiresAt: { type: Date, default: null },
    redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    redeemedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Voucher", voucherSchema);

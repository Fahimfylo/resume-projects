const mongoose = require("mongoose");

const specialDealSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    codes: {
      type: Number,
      default: 1,
      min: 1,
    },
    discount: {
      type: String,
      default: "",
    },
    priceUSD: {
      type: Number,
      default: 0,
      min: 0,
    },
    originalPriceUSD: {
      type: Number,
      default: 0,
      min: 0,
    },
    priceBDT: {
      type: Number,
      default: 0,
      min: 0,
    },
    emailCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    phoneCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    verificationCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    exportCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    emailSeats: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxRedeems: {
      type: Number,
      default: 1,
      min: 0,
    },
    timesRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SpecialDeal", specialDealSchema);

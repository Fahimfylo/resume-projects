const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    validUntil: {
      type: Date,
    },
    usageLimit: {
      type: Number, // Maximum number of times the coupon can be used
    },
    timesUsed: {
      type: Number, // Number of times the coupon has been used
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", couponSchema);

const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planModel: {
      type: String,
      enum: ["Plan", "CustomPlan"],
      default: "Plan",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "planModel",
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired", "cancelled"],
      default: "active",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "anually", "lifetime"],
      required: true,
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;

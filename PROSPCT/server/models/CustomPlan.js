const mongoose = require("mongoose");

const customPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    pricing: {
      monthly: {
        price: {
          type: Number,
          min: [0, "Price cannot be negative"],
          required: true,
        },
        discount: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        finalPrice: {
          type: Number,
          min: [0, "Final price cannot be negative"],
          default: 0,
        },
      },
      yearly: {
        price: {
          type: Number,
          min: [0, "Price cannot be negative"],
          required: true,
        },
        discount: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        finalPrice: {
          type: Number,
          min: [0, "Final price cannot be negative"],
          default: 0,
        },
      },
    },

    features: {
      emailCredits: { max: { type: Number, default: 0 } },
      phoneCredits: { max: { type: Number, default: 0 } },
      verificationCredits: { max: { type: Number, default: 0 } },
      exportCredits: { max: { type: Number, default: 0 } },

      apiAccess: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },

      limits: {
        csvEnrichment: { type: Boolean, default: false },
        technologyFilter: { type: Boolean, default: false },
        jobPostingFilter: { type: Boolean, default: false },
        revenueFilter: { type: Boolean, default: false },
        fundingFilter: { type: Boolean, default: false },
        basicIntegrations: { type: Boolean, default: false },
        jobChangeFilter: { type: Boolean, default: false },
        duplicateControl: { type: Boolean, default: false },
        hubspotIntegration: { type: Boolean, default: false },
        salesforceIntegration: { type: Boolean, default: false },
        jobChangeTracking: { type: Boolean, default: false },
      },
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    recommended: { type: Boolean, default: false },

    type: {
      type: String,
      enum: ["custom"],
      default: "custom",
    },

    duration: {
      type: String,
      enum: ["monthly", "yearly", "lifetime"],
      default: "yearly",
    },

    assigned: {
      type: [String],
      default: [],
    },

    maxUsers: {
      type: Number,
      default: 1,
      min: [1, "Minimum users must be 1"],
    },
  },
  { timestamps: true },
);

customPlanSchema.methods.calculateFinalPrice = function (price, discount) {
  return Math.round((price - (price * discount) / 100) * 100) / 100;
};

customPlanSchema.methods.updateFinalPrices = function () {
  this.pricing.monthly.finalPrice = this.calculateFinalPrice(
    this.pricing.monthly.price,
    this.pricing.monthly.discount,
  );
  this.pricing.yearly.finalPrice = this.calculateFinalPrice(
    this.pricing.yearly.price,
    this.pricing.yearly.discount,
  );
};

customPlanSchema.pre("save", function (next) {
  this.updateFinalPrices();
  next();
});

const CustomPlan = mongoose.model("CustomPlan", customPlanSchema);

module.exports = CustomPlan;

// models/Plan.js
const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    // ===============================
    // BASIC INFO
    // ===============================
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // ===============================
    // USER / TEAM LIMITS
    // ===============================
    maxUsers: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "Minimum users must be 1"],
    },

    // ===============================
    // PRICING
    // ===============================
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

    // ===============================
    // FEATURES
    // ===============================
    features: {
      // Numeric Limits
      emailCredits: {
        max: {
          type: Number,
          default: 0,
        },
      },

      phoneCredits: {
        max: {
          type: Number,
          default: 0,
        },
      },

      verificationCredits: {
        max: {
          type: Number,
          default: 0,
        },
      },

      exportCredits: {
        max: {
          type: Number,
          default: 0,
        },
      },

      // Feature Toggles
      apiAccess: {
        type: Boolean,
        default: false,
      },

      prioritySupport: {
        type: Boolean,
        default: false,
      },

      // Resource Limit Toggles
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
        keywordsFilter: { type: Boolean, default: false },
        seniorityFilter: { type: Boolean, default: false },
        personNameFilter: { type: Boolean, default: false },
        employeeRangeFilter: { type: Boolean, default: false },
        emailStatusFilter: { type: Boolean, default: false },
        emailTypeFilter: { type: Boolean, default: false },
        foundedYearFilter: { type: Boolean, default: false },
        organizationNameFilter: { type: Boolean, default: false },
        countryFilter: { type: Boolean, default: false },
        zipFilter: { type: Boolean, default: false },
        industryFilter: { type: Boolean, default: false },
      },
    },

    // ===============================
    // PLAN SETTINGS
    // ===============================
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    recommended: {
      type: Boolean,
      default: false,
    },

    type: {
      type: String,
      enum: ["official", "custom", "free"],
      default: "official",
    },

    duration: {
      type: String,
      enum: ["monthly", "yearly", "lifetime"],
      default: "yearly",
    },

    // ===============================
    // ASSIGNED USERS (emails)
    // Only buyers/team owners
    // NOT invited team members
    // ===============================
    assigned: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// ===============================
// INDEXES
// ===============================

// Fast plan lookup by status
planSchema.index({ status: 1 });

// Fast lookup by type
planSchema.index({ type: 1 });

// Fast lookup by assigned user
planSchema.index({ assigned: 1 });

// ===============================
// METHODS
// ===============================

// Calculate discounted price
planSchema.methods.calculateFinalPrice = function (price, discount) {
  return Math.round((price - (price * discount) / 100) * 100) / 100;
};

// Update all final prices
planSchema.methods.updateFinalPrices = function () {
  this.pricing.monthly.finalPrice = this.calculateFinalPrice(
    this.pricing.monthly.price,
    this.pricing.monthly.discount,
  );

  this.pricing.yearly.finalPrice = this.calculateFinalPrice(
    this.pricing.yearly.price,
    this.pricing.yearly.discount,
  );
};

// Assign buyer/team owner by email
planSchema.methods.assignUser = function (email) {
  if (this.assigned.includes(email)) {
    throw new Error("User already assigned to this plan");
  }

  this.assigned.push(email);
};

// Remove assigned buyer/team owner by email
planSchema.methods.removeAssignedUser = function (email) {
  this.assigned = this.assigned.filter((e) => e !== email);
};

// ===============================
// PRE SAVE HOOK
// ===============================
planSchema.pre("save", function (next) {
  this.updateFinalPrices();
  next();
});

// ===============================
// EXPORT
// ===============================
const Plan = mongoose.model("Plan", planSchema);

module.exports = Plan;

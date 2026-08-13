const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
  },
  company: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  countryCode: {
    type: String,
    default: "+1",
  },
  phone: {
    type: String,
    trim: true,
  },
  alternativeEmails: {
    type: [String],
    default: [],
  },
  password: {
    type: String,
    minlength: 8,
  },
  googleId: {
    type: String,
  },
  telegramId: {
    type: String,
  },
  linkedInId: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  credits: {
    emailCredits: {
      current: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    phoneCredits: {
      current: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    verificationCredits: {
      current: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    exportCredits: {
      current: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    default: null,
  },
  planType: {
    type: String,
    enum: ["official", "custom", "free"],
    default: null,
  },
  redeemedDeal: {
    type: String,
    default: null,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
  },
  limits: {
    csvEnrichment:        { type: Boolean, default: false },
    technologyFilter:     { type: Boolean, default: false },
    jobPostingFilter:     { type: Boolean, default: false },
    revenueFilter:        { type: Boolean, default: false },
    fundingFilter:        { type: Boolean, default: false },
    basicIntegrations:    { type: Boolean, default: false },
    jobChangeFilter:      { type: Boolean, default: false },
    duplicateControl:     { type: Boolean, default: false },
    hubspotIntegration:   { type: Boolean, default: false },
    salesforceIntegration:{ type: Boolean, default: false },
    jobChangeTracking:    { type: Boolean, default: false },
  },

  token: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    default: "user", // Global role: "user" | "admin"
  },
  // Team-specific role for workspace permissions
  teamRole: {
    type: String,
    enum: ["owner", "admin", "member"],
    default: null,
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: true // Default to true for existing users, set to false explicitly for new signups
  },
  verificationOTP: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Who invited this user (optional referral relationship)
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  // Team context for users who registered via team invite
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;

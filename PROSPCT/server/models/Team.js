// models/Team.js
const mongoose = require("mongoose");

// ===============================
// MEMBER SUBDOCUMENT
// ===============================
const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null until invited user registers/joins
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    company: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    countryCode: {
      type: String,
      trim: true,
      maxlength: 5,
      default: "",
    },

    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },

    status: {
      type: String,
      enum: ["pending", "joined", "removed", "rejected", "expired"],
      default: "pending",
    },

    invitedAt: {
      type: Date,
      default: Date.now,
    },

    joinedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

// ===============================
// TEAM SCHEMA
// ===============================
const teamSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Connected purchased plan
    purchasedPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
    },

    // Max team members allowed (copied from plan at purchase time)
    maxUsers: {
      type: Number,
      default: 1,
      min: [1, "Minimum max users must be 1"],
    },

    members: {
      type: [memberSchema],
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

// Fast lookup by owner
teamSchema.index({ owner: 1 });

// Fast lookup by member email
teamSchema.index({ "members.email": 1 });

// Fast lookup by linked user
teamSchema.index({ "members.user": 1 });

// Prevent duplicate member email inside same team
teamSchema.index(
  { owner: 1, "members.email": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "members.email": { $exists: true },
    },
  },
);

// ===============================
// INSTANCE METHODS
// ===============================

// Check if team can invite more members
teamSchema.methods.canInviteMoreMembers = async function () {
  // If plan is not purchased, no invites allowed
  if (!this.purchasedPlan) {
    return false;
  }

  // @BACKFILL: maxUsers is copied from plan at purchase time.
  // Existing teams without maxUsers fall back to purchasedPlan.maxUsers or 1.
  const maxUsers = this.maxUsers || this.purchasedPlan?.maxUsers || 1;

  // Owner counts as a seat
  const usedSeats = this.members.filter(
    (m) => m.status !== "removed",
  ).length + 1;

  return usedSeats < maxUsers;
};

// Get remaining seats
teamSchema.methods.getRemainingSeats = async function () {
  if (!this.purchasedPlan) {
    return 0;
  }

  // @BACKFILL: maxUsers is copied from plan at purchase time.
  // Existing teams without maxUsers fall back to purchasedPlan.maxUsers or 1.
  const maxUsers = this.maxUsers || this.purchasedPlan?.maxUsers || 1;

  const usedSeats = this.members.filter(
    (m) => m.status !== "removed",
  ).length + 1;

  return Math.max(maxUsers - usedSeats, 0);
};

// Add member safely
teamSchema.methods.addMember = async function (memberData) {
  const email = memberData.email.toLowerCase().trim();

  // Check duplicate
  const exists = this.members.find(
    (m) => m.email === email && m.status !== "removed",
  );

  if (exists) {
    throw new Error("Member already exists in team");
  }

  // Check seat availability
  const canInvite = await this.canInviteMoreMembers();

  if (!canInvite) {
    throw new Error("Team member limit reached");
  }

  this.members.push({
    ...memberData,
    email,
  });
};

// Mark invited member as joined
teamSchema.methods.markMemberJoined = function (
  email,
  userId,
  firstName,
  lastName,
) {
  const member = this.members.find(
    (m) => m.email === email.toLowerCase(),
  );

  if (!member) {
    throw new Error("Member not found");
  }

  member.user = userId;
  member.status = "joined";
  member.joinedAt = new Date();

  if (firstName) {
    member.firstName = firstName;
  }

  if (lastName) {
    member.lastName = lastName;
  }
};

// Remove member
teamSchema.methods.removeMember = function (email) {
  const normalized = email.toLowerCase().trim();
  const member = this.members.find(
    (m) => m.email && m.email.toLowerCase().trim() === normalized,
  );

  if (!member) {
    throw new Error("Member not found");
  }

  member.status = "removed";
};

// Remove all members
teamSchema.methods.removeAllMembers = function () {
  this.members = [];
};

// ===============================
// STATIC METHODS
// ===============================

// Find team by member email
teamSchema.statics.findByMemberEmail = function (email) {
  return this.findOne({
    "members.email": email.toLowerCase(),
  });
};

// ===============================
// EXPORT
// ===============================
module.exports = mongoose.model("Team", teamSchema);
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  // ====================================
  // 🔐 CORE AUTHENTICATION
  // ====================================
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  password: {
    type: String,
    minlength: 8,
  },
  role: {
    type: String,
    enum: ["USER", "ADMIN"],
    required: true,
    default: "USER",
  },
  provider: {
    type: String,
    enum: ["local", "google", "linkedin", "telegram", null],
    default: "local",
  },

  // ====================================
  // 👤 PROFILE INFORMATION
  // ====================================
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
  profilePicture: {
    type: String,
  },
  company: {
    type: String,
  },

  // ====================================
  // 🔑 OAUTH PROVIDERS (Optional)
  // ====================================
  googleId: {
    type: String,
  },
  linkedInId: {
    type: String,
  },
  telegramId: {
    type: String,
  },

  // ====================================
  // 💳 USER-ONLY: CREDITS & BILLING
  // (NULL for ADMIN role)
  // ====================================
  credits: {
    emailCredits: {
      current: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
    },
    phoneCredits: {
      current: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
    },
    verificationCredits: {
      current: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
    },
    exportCredits: {
      current: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
    },
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
  },

  // ====================================
  // ✅ ACCOUNT STATUS
  // ====================================
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: true,
  },
  verificationOTP: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },

  // ====================================
  // 📅 TIMESTAMPS & TRACKING
  // ====================================
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // ====================================
  // 🔄 MIGRATION TRACKING
  // (Remove after migration period)
  // ====================================
  migratedFrom: {
    type: String,
    enum: ["USER_COLLECTION", "ADMIN_COLLECTION", "NEW_SIGNUP", null],
    default: null,
  },
  migratedAt: {
    type: Date,
    default: null,
  },
  originalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  originalAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
});

// ====================================
// 🔐 UPDATE TIMESTAMP MIDDLEWARE
// ====================================
accountSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

accountSchema.pre("updateOne", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

accountSchema.pre("updateMany", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;

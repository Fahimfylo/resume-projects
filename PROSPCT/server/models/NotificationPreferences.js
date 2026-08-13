const mongoose = require("mongoose");

const notificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  },

  // ====================================
  // 🔔 IN-APP NOTIFICATIONS
  // ====================================
  inApp: {
    bell: { type: Boolean, default: true },
    popup: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    tabDot: { type: Boolean, default: true },
  },

  // ====================================
  // 📧 EMAIL NOTIFICATIONS
  // ====================================
  email: {
    export: { type: Boolean, default: false },
    search: { type: Boolean, default: false },
    onboarding: { type: Boolean, default: false },
    database: { type: Boolean, default: false },
    credit: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

const NotificationPreferences = mongoose.model(
  "NotificationPreferences",
  notificationPreferencesSchema,
);

module.exports = NotificationPreferences;

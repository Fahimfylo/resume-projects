const NotificationPreferences = require("../models/NotificationPreferences");
const { getIO } = require("../utils/socket");

/**
 * Pushes an in-app notification to the user's session/store.
 * Call this from any controller when an action completes.
 *
 * @param {object} params
 * @param {string} params.userId - The user to notify
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification body
 * @param {string} params.type - 'success' | 'error' | 'info'
 * @param {string} params.category - 'export' | 'search' | 'onboarding' | 'database' | 'credit'
 */
const pushNotification = async ({ userId, title, message, type = "info", category }) => {
  if (!userId) return;

  // Check user preferences to see if they want this notification
  if (category) {
    const prefs = await NotificationPreferences.findOne({ userId }).lean();
    if (prefs) {
      const emailCategoryMap = {
        export: "export",
        search: "search",
        onboarding: "onboarding",
        database: "database",
        credit: "credit",
      };

      const emailKey = emailCategoryMap[category];
      const emailEnabled = prefs.email?.[emailKey];

      if (emailEnabled) {
        // Queue email to be sent asynchronously
        // TODO: Integrate with your email service here
        // await sendEmailNotification(userEmail, category, data);
      }

      // Check if in-app bell notification is enabled
      if (!prefs.inApp?.bell) {
        return; // User disabled bell notifications
      }
    }
  }

  // Push notification via Socket.io
  const io = getIO();
  if (io) {
    io.to(`user_${userId}`).emit("notification", {
      id: Date.now().toString(),
      title,
      message,
      type,
      category,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = { pushNotification };

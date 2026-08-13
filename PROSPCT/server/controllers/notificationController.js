const NotificationPreferences = require("../models/NotificationPreferences");

const notificationController = {
  // GET /api/notification/preferences
  getPreferences: async (req, res) => {
    try {
      const userId = req.user.userId || req.user._id;

      let prefs = await NotificationPreferences.findOne({ userId });

      // Create defaults if not found
      if (!prefs) {
        prefs = new NotificationPreferences({ userId });
        await prefs.save();
      }

      res.status(200).json({
        success: true,
        data: prefs,
      });
    } catch (error) {
      console.error("Get notification preferences error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },

  // PUT /api/notification/preferences
  updatePreferences: async (req, res) => {
    try {
      const userId = req.user.userId || req.user._id;
      const { inApp, email } = req.body;

      // Validate input
      if (!inApp && !email) {
        return res.status(400).json({
          message: "At least one preference (inApp or email) must be provided",
        });
      }

      // Build update object — only include provided keys
      const update = {};
      if (inApp) update["inApp"] = inApp;
      if (email) update["email"] = email;

      const prefs = await NotificationPreferences.findOneAndUpdate(
        { userId },
        { $set: update },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      res.status(200).json({
        success: true,
        data: prefs,
        message: "Notification preferences updated",
      });
    } catch (error) {
      console.error("Update notification preferences error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },
};

module.exports = notificationController;

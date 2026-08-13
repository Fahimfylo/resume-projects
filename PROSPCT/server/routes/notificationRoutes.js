const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require authentication
router.get("/preferences", authMiddleware, notificationController.getPreferences);
router.put("/preferences", authMiddleware, notificationController.updatePreferences);

// POST /settings/notifications/push — trigger a notification manually
router.post("/push", authMiddleware, async (req, res) => {
  try {
    const { title, message, type, category } = req.body;
    const { pushNotification } = require("../services/notificationService");

    const userId = req.user.userId || req.user._id;

    await pushNotification({
      userId,
      title: title || "Notification",
      message: message || "",
      type: type || "info",
      category,
    });

    res.status(200).json({ success: true, message: "Notification pushed" });
  } catch (error) {
    console.error("Push notification error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;

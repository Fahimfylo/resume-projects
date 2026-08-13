const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getLayoutOrder,
  getPublicSettings,
  uploadSlideImage,
  testSettings,
  sendTestEmail,
} = require("../controllers/systemSettingController");
const adminMiddleware = require("../middleware/adminMiddleware");
const { imageUpload } = require("../config/multerConfig");

// public endpoints
router.get("/layout-order", getLayoutOrder);
router.get("/public", getPublicSettings);

// admin upload endpoints
router.post(
  "/upload-slide-image",
  adminMiddleware,
  imageUpload.single("image"),
  uploadSlideImage,
);

// admin-protected settings endpoints
router.get("/", adminMiddleware, getSettings);
router.put("/", adminMiddleware, updateSettings);
router.post("/test", adminMiddleware, testSettings);
router.post("/test-email", adminMiddleware, sendTestEmail);

module.exports = router;

const express = require("express");
const importController = require("../controllers/importController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/featureAccessMiddleware");
const { csvUpload } = require("../config/multerConfig");

const router = express.Router();

// Upload a CSV/XLS/XLSX file for import (preview only)
router.post(
  "/upload",
  authMiddleware,
  csvUpload.single("file"),
  importController.uploadImportFile,
);

// Placeholder sync webhook endpoint (e.g. Zapier Webhooks)
router.post("/sync", authMiddleware, requireFeature("basicIntegrations"), importController.syncWebhook);

module.exports = router;

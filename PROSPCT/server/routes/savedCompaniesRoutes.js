const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");
const { requireFeature } = require("../middleware/featureAccessMiddleware");
const savedCompaniesController = require("../controllers/savedCompaniesController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiter for saved companies routes
const savedCompaniesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

router.get("/list", savedCompaniesLimiter, authMiddleware, workspaceContextMiddleware, savedCompaniesController.getSavedCompaniesList);
router.post("/add", savedCompaniesLimiter, authMiddleware, workspaceContextMiddleware, savedCompaniesController.addSavedCompanies);
router.delete("/", savedCompaniesLimiter, authMiddleware, workspaceContextMiddleware, savedCompaniesController.deleteSavedCompanies);
router.delete("/all", savedCompaniesLimiter, authMiddleware, workspaceContextMiddleware, savedCompaniesController.deleteAllSavedCompanies);
router.post("/cleanup", savedCompaniesLimiter, authMiddleware, workspaceContextMiddleware, requireFeature("duplicateControl"), savedCompaniesController.cleanupDuplicateCompanies);

module.exports = router;

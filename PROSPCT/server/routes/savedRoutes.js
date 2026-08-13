const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");
const savedController = require("../controllers/savedController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiter for saved routes
const savedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

router.get("/list", savedLimiter, authMiddleware, workspaceContextMiddleware, savedController.getList);
router.post("/add", savedLimiter, authMiddleware, workspaceContextMiddleware, savedController.addSavedItems);
router.delete("/", savedLimiter, authMiddleware, workspaceContextMiddleware, savedController.deleteSavedItems);
router.delete("/all", savedLimiter, authMiddleware, workspaceContextMiddleware, savedController.deleteAllSavedItems);

module.exports = router;

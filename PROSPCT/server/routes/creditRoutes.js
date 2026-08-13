const express = require("express");
const creditsController = require("../controllers/creditController");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");

const router = express.Router();

router.post("/deduct", authMiddleware, workspaceContextMiddleware, creditsController.deductCredits);
router.get("/history", authMiddleware, workspaceContextMiddleware, creditsController.getUsageHistory);
router.get("/", authMiddleware, workspaceContextMiddleware, creditsController.getCredits);

module.exports = router;

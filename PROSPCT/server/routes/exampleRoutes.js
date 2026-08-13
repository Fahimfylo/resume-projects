const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");
const { exampleController, requireRole } = require("../controllers/exampleController");

/**
 * Example Protected Routes
 *
 * All routes use:
 *   1. authMiddleware - Validates JWT and sets req.user
 *   2. workspaceContextMiddleware - Determines workspace owner context
 *
 * Usage pattern for YOUR existing routes:
 *   - Replace all queries that use `owner: req.user.userId`
 *   - With `owner: req.workspaceOwner`
 */

// Public info about the authenticated user's workspace
router.get("/workspace", authMiddleware, workspaceContextMiddleware, exampleController.getWorkspaceInfo);

// Get workspace credits (members see owner's credits)
router.get("/credits", authMiddleware, workspaceContextMiddleware, exampleController.getWorkspaceCredits);

// Get workspace data (both owners and members can view)
router.get("/data", authMiddleware, workspaceContextMiddleware, exampleController.getWorkspaceData);

// Create resource (both owners and members can create)
router.post("/data", authMiddleware, workspaceContextMiddleware, exampleController.createResource);

// Delete resource (owner ONLY - uses requireRole guard)
router.delete("/data/:resourceId", authMiddleware, workspaceContextMiddleware, requireRole("owner"), exampleController.deleteResource);

module.exports = router;

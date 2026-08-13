const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");
const recentSearchController = require("../controllers/recentSearchControllers");

const router = express.Router();

// Get recent searches (scoped to workspace)
router.get("/", authMiddleware, workspaceContextMiddleware, recentSearchController.getRecentSearches);

// Save a new recent search (scoped to workspace)
router.post("/", authMiddleware, workspaceContextMiddleware, recentSearchController.createRecentSearch);

// Delete a recent search by id (scoped to workspace)
router.delete("/:id", authMiddleware, workspaceContextMiddleware, recentSearchController.deleteRecentSearch);

module.exports = router;

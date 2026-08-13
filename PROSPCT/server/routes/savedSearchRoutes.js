const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");
const savedSearchController = require("../controllers/savedSearchController");
const router = express.Router();

// Get all saved searches for workspace
router.get("/", authMiddleware, workspaceContextMiddleware, savedSearchController.getSavedSearches);

router.post("/", authMiddleware, workspaceContextMiddleware, savedSearchController.addSaveSearch);
// Get savedSearch item by id
router.get(
  "/:searchId",
  authMiddleware,
  workspaceContextMiddleware,
  savedSearchController.getSavedSearchById,
);

// delete saved search
router.delete("/:id", authMiddleware, workspaceContextMiddleware, savedSearchController.deleteSavedSearch);

module.exports = router;

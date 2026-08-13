const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");
const folderController = require("../controllers/folderController");

const router = express.Router();

router.post("/", authMiddleware, workspaceContextMiddleware, folderController.createFolder);
router.get("/", authMiddleware, workspaceContextMiddleware, folderController.getFolders);
router.delete("/:id", authMiddleware, workspaceContextMiddleware, folderController.deleteFolder);

module.exports = router;

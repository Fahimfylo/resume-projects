const listController = require("../controllers/listControllers");

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const workspaceContextMiddleware = require("../middleware/workspaceContextMiddleware");

const router = express.Router();

router.post("/add", authMiddleware, workspaceContextMiddleware, listController.addList);
router.post("/add-item", authMiddleware, workspaceContextMiddleware, listController.addItemToList);
router.get("/", authMiddleware, workspaceContextMiddleware, listController.getListByUserId);
router.get("/page-data", authMiddleware, workspaceContextMiddleware, listController.getListsPageData);
router.get("/:listId/data", authMiddleware, workspaceContextMiddleware, listController.getListData);
router.patch("/:id", authMiddleware, workspaceContextMiddleware, listController.updateList);
router.delete("/:id", authMiddleware, workspaceContextMiddleware, listController.deleteList);

module.exports = router;

const express = require("express");
const router = express.Router();
const redemptionController = require("../controllers/redemptionController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/request-redeem", authMiddleware, redemptionController.requestRedemption);

router.get("/requests/pending", adminMiddleware, redemptionController.getPendingRequests);
router.post("/requests/approve/:id", adminMiddleware, redemptionController.approveRequest);
router.post("/requests/reject/:id", adminMiddleware, redemptionController.rejectRequest);

router.get("/assigned", adminMiddleware, redemptionController.getAssigned);
router.post("/assigned/suspend/:id", adminMiddleware, redemptionController.suspendAssignment);
router.post("/assigned/unsuspend/:id", adminMiddleware, redemptionController.unsuspendAssignment);
router.delete("/assigned/delete/:id", adminMiddleware, redemptionController.deleteAssignment);

module.exports = router;

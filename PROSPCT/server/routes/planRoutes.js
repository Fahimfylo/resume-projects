const planController = require("../controllers/planController");
const { assignOfficialPlan, removePlanAssignment, getPlanAssignments } = require("../controllers/adminPlanAssignmentController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const express = require("express");
const router = express.Router();

router.get("/official", authMiddleware, planController.getOfficialPlans);
router.get("/", adminMiddleware, planController.getPlans);
router.get("/:id", adminMiddleware, planController.getPlanById);
router.post("/upgrade", authMiddleware, planController.upgradePlan);
router.post("/addPlan", adminMiddleware, planController.addPlan); 
router.put("/:id", adminMiddleware, planController.updatePlan);
router.delete("/delete/:id", adminMiddleware, planController.deletePlan);

// Plan Assignment Routes
router.post("/assign-plan", adminMiddleware, assignOfficialPlan);
router.delete("/remove-plan-assignment/:userId", adminMiddleware, removePlanAssignment);
router.delete("/remove-plan-assignment", adminMiddleware, removePlanAssignment);
router.get("/plan-assignments/:planId", adminMiddleware, getPlanAssignments);


// router.post("/subscription-update", planController.updateAllUserSubscriptions);

module.exports = router;

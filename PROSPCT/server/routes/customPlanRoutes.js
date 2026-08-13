const customPlanController = require("../controllers/customPlanController");
const { assignCustomPlan, removeCustomPlanAssignment, getCustomPlanAssignments } = require("../controllers/adminCustomPlanAssignmentController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const express = require("express");
const router = express.Router();

router.get("/", adminMiddleware, customPlanController.getCustomPlans);
router.get("/:id", adminMiddleware, customPlanController.getCustomPlanById);
router.post("/addPlan", adminMiddleware, customPlanController.addCustomPlan);
router.put("/:id", adminMiddleware, customPlanController.updateCustomPlan);
router.delete("/delete/:id", adminMiddleware, customPlanController.deleteCustomPlan);

// Custom Plan Assignment Routes
router.post("/assign-custom-plan", adminMiddleware, assignCustomPlan);
router.delete("/remove-custom-plan-assignment", adminMiddleware, removeCustomPlanAssignment);
router.get("/custom-plan-assignments/:planId", adminMiddleware, getCustomPlanAssignments);

module.exports = router;

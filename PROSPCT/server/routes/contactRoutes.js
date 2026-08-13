const contactController = require("../controllers/contactController");
const authMiddleware = require("../middleware/authMiddleware");

const express = require("express");
const router = express.Router();

router.post("/custom-plan", authMiddleware, contactController.sendCustomPlanRequest);

module.exports = router;

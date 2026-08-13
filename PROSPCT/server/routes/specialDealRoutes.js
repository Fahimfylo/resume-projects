const express = require("express");
const router = express.Router();
const specialDealController = require("../controllers/specialDealController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", adminMiddleware, specialDealController.getAllSpecialDeals);
router.get("/search", adminMiddleware, specialDealController.getSpecialDealsBySearch);
router.get("/:id", adminMiddleware, specialDealController.getSpecialDealById);
router.post("/add", adminMiddleware, specialDealController.createSpecialDeal);
router.put("/update/:id", adminMiddleware, specialDealController.updateSpecialDeal);
router.delete("/delete/:id", adminMiddleware, specialDealController.deleteSpecialDeal);

router.post("/redeem", authMiddleware, specialDealController.redeemSpecialDeal);

module.exports = router;

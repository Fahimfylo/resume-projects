const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", adminMiddleware, couponController.getAllCoupons);
router.get("/search", adminMiddleware, couponController.getCouponsBySearch);
router.get("/code/:couponCode", authMiddleware, couponController.getCouponWithCode);
router.get("/:id", adminMiddleware, couponController.getCouponById);
router.post("/addCoupon", adminMiddleware, couponController.createCoupon);
// router.post("/delete", authMiddleware, couponController.deleteAllCoupons);
router.put("/update/:id", adminMiddleware, couponController.updateCoupon);
router.delete("/delete/:id", adminMiddleware, couponController.deleteCoupon);


module.exports = router;

const express = require("express");
const router = express.Router();
const voucherRedeemController = require("../controllers/voucherRedeemController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/validate/token/:token", voucherRedeemController.validateVoucher);
router.get("/validate/:code", voucherRedeemController.validateVoucher);
router.post("/redeem", authMiddleware, voucherRedeemController.redeemVoucher);
router.post("/register-and-redeem", voucherRedeemController.registerAndRedeem);
router.get("/my-pending", authMiddleware, voucherRedeemController.getMyPendingVouchers);

module.exports = router;

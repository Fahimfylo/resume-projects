const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const voucherRedeemController = require('../controllers/voucherRedeemController');
const redemptionLogController = require('../controllers/redemptionLogController');
const adminMiddleware = require('../middleware/adminMiddleware');

// POST /admin/special-deals/requests -> generate voucher (no auth, uses API key)
router.post('/', voucherController.generateVoucher);

// POST /admin/special-deals/requests/sync -> sync a fallback-generated voucher into MongoDB
router.post('/sync', voucherRedeemController.syncVoucher);

// GET /admin/special-deals/requests -> list voucher requests (admin only)
router.get('/', adminMiddleware, voucherController.listVouchers);

// GET /admin/special-deals/requests/redemption-logs -> list redemption logs (admin only)
router.get('/redemption-logs', adminMiddleware, redemptionLogController.getRedemptionLogs);

module.exports = router;

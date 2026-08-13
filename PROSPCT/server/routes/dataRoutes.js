const dataController = require("../controllers/dataController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const express = require("express");
const router = express.Router();

// Route to get total completed transactions and their total amount
router.get("/total-completed", adminMiddleware, dataController.getTotalCompletedTransactions);


// Route to get subscription statistics (counts for each subscription type)
router.get("/subscription-stats", adminMiddleware, dataController.getSubscriptionStatistics);

// Route to get total revenue for each plan type
router.get("/plan-revenue", authMiddleware, dataController.getPlanRevenueStatistics);

// ── Dashboard Aggregation Routes (admin only) ──
router.get("/dashboard/revenue-over-time", adminMiddleware, dataController.getRevenueOverTime);
router.get("/dashboard/user-signups", adminMiddleware, dataController.getUserSignupsOverTime);
router.get("/dashboard/transaction-breakdown", adminMiddleware, dataController.getTransactionBreakdown);
router.get("/dashboard/subscription-breakdown", adminMiddleware, dataController.getSubscriptionBreakdown);
router.get("/dashboard/billing-cycle", adminMiddleware, dataController.getBillingCycleDistribution);
router.get("/dashboard/user-plan-distribution", adminMiddleware, dataController.getUserPlanDistribution);
router.get("/dashboard/payment-gateway-revenue", adminMiddleware, dataController.getPaymentGatewayRevenue);
router.get("/dashboard/transaction-types", adminMiddleware, dataController.getTransactionTypeBreakdown);
router.get("/dashboard/kpi-summary", adminMiddleware, dataController.getKpiSummary);

module.exports = router;

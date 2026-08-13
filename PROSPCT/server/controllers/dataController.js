const Transaction = require('../models/Transaction');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plans');
const User = require('../models/User');
const SpecialDealRedemption = require('../models/SpecialDealRedemption');

// Controller for transaction and subscription statistics
const dataController = {
  // Function to get total completed transactions and their total amount
  getTotalCompletedTransactions: async (req, res) => {
    try {
      const completedTransactions = await Transaction.aggregate([
        { $match: { status: 'COMPLETED' } }, // Filter only completed transactions
        { 
          $group: {
            _id: null, 
            totalCount: { $sum: 1 }, // Count of transactions
            totalAmount: { $sum: "$totalAmount" } // Sum of total amounts
          }
        }
      ]);
  
      // If no completed transactions are found, return 0 for both totalCount and totalAmount
      const totalCount = completedTransactions.length > 0 ? completedTransactions[0].totalCount : 0;
      const totalAmount = completedTransactions.length > 0 ? completedTransactions[0].totalAmount : 0;
  
      return res.status(200).json({
        totalCount,
        totalAmount
      });
    } catch (err) {
      console.error("Error fetching total completed transactions:", err);
      return res.status(500).json({ message: "Error fetching total completed transactions" });
    }
  },
  


  getSubscriptionStatistics: async (req, res) => {
    try {
      // Find all active subscriptions and populate the plan field to get the plan details
      const activeSubscriptions = await Subscription.find({ status: 'active' })
        .populate('plan') // Populate the plan field with plan details
        .exec();
  
      // Log the active subscriptions to check the result
  
      // Initialize counts for different plan types (default to 0)
      const subscriptionCounts = {
        free: 0,
        basic: 0,
        premium: 0,
        professional: 0,
        custom: 0,
      };
  
      // Process each active subscription and check the plan name
      activeSubscriptions.forEach(sub => {
        // Check if the plan exists before accessing the name
        if (sub.plan && sub.plan.name) {
  
          if (sub.plan.name.toLowerCase() === "free") {
            subscriptionCounts.free += 1;
          } else if (sub.plan.name.toLowerCase() === "basic") {
            subscriptionCounts.basic += 1;
          } else if (sub.plan.name.toLowerCase() === "premium") {
            subscriptionCounts.premium += 1;
          } else if (sub.plan.name.toLowerCase() === "professional") {
            subscriptionCounts.professional += 1;
          } else if (sub.plan.name.toLowerCase() === "custom") {
            subscriptionCounts.custom += 1;
          }
        } else {
          // If no plan is associated, log a warning
          // console.warn("Subscription with no plan:", sub._id);
        }
      });
  
  
      return res.status(200).json(subscriptionCounts);
    } catch (err) {
      console.error("Error fetching subscription statistics:", err);
      return res.status(500).json({ message: "Error fetching subscription statistics" });
    }
  },
  
  
  

  // Function to get total amount spent on each plan type (free, basic, premium, professional, custom)
  getPlanRevenueStatistics: async (req, res) => {
    try {
      const planRevenue = await Transaction.aggregate([
        { $match: { status: 'COMPLETED' } }, // Filter only completed transactions
        { $unwind: "$items" }, // Unwind the items array
        { $match: { "items.plan": { $exists: true } } }, // Filter for items with plans
        { 
          $group: {
            _id: "$items.plan.name", // Group by plan name
            totalAmount: { $sum: "$totalAmount" } // Sum the total amounts for each plan
          }
        }
      ]);
  
      // If no plan revenue data is found, return 0 for each plan type
      const revenueStats = {
        free: 0,
        basic: 0,
        premium: 0,
        professional: 0,
        custom: 0,
      };
  
      planRevenue.forEach(curr => {
        revenueStats[curr._id.toLowerCase()] = curr.totalAmount;
      });
  
      return res.status(200).json(revenueStats);
    } catch (err) {
      console.error("Error fetching plan revenue statistics:", err);
      return res.status(500).json({ message: "Error fetching plan revenue statistics" });
    }
  },
  
  
  // ── Dashboard Aggregation Endpoints ──

  getRevenueOverTime: async (req, res) => {
    try {
      const months = parseInt(req.query.months) || 12;
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      since.setDate(1);

      const revenue = await Transaction.aggregate([
        { $match: { status: 'COMPLETED', createdAt: { $gte: since } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            revenue: 1,
            count: 1,
          },
        },
      ]);

      return res.status(200).json(revenue);
    } catch (err) {
      console.error('Error fetching revenue over time:', err);
      return res.status(500).json({ message: 'Error fetching revenue over time' });
    }
  },

  getUserSignupsOverTime: async (req, res) => {
    try {
      const months = parseInt(req.query.months) || 12;
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      since.setDate(1);

      const signups = await User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            count: 1,
          },
        },
      ]);

      return res.status(200).json(signups);
    } catch (err) {
      console.error('Error fetching user signups:', err);
      return res.status(500).json({ message: 'Error fetching user signups' });
    }
  },

  getTransactionBreakdown: async (req, res) => {
    try {
      const breakdown = await Transaction.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const result = { COMPLETED: 0, PENDING: 0, FAILED: 0, REFUNDED: 0 };
      breakdown.forEach((item) => { result[item._id] = item.count; });

      return res.status(200).json(result);
    } catch (err) {
      console.error('Error fetching transaction breakdown:', err);
      return res.status(500).json({ message: 'Error fetching transaction breakdown' });
    }
  },

  getSubscriptionBreakdown: async (req, res) => {
    try {
      const breakdown = await Subscription.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const result = { active: 0, inactive: 0, expired: 0, cancelled: 0 };
      breakdown.forEach((item) => { result[item._id] = item.count; });

      return res.status(200).json(result);
    } catch (err) {
      console.error('Error fetching subscription breakdown:', err);
      return res.status(500).json({ message: 'Error fetching subscription breakdown' });
    }
  },

  getBillingCycleDistribution: async (req, res) => {
    try {
      const distribution = await Subscription.aggregate([
        { $group: { _id: '$billingCycle', count: { $sum: 1 } } },
      ]);

      const result = { monthly: 0, anually: 0, lifetime: 0 };
      distribution.forEach((item) => { result[item._id] = item.count; });

      return res.status(200).json(result);
    } catch (err) {
      console.error('Error fetching billing cycle distribution:', err);
      return res.status(500).json({ message: 'Error fetching billing cycle distribution' });
    }
  },

  getUserPlanDistribution: async (req, res) => {
    try {
      const distribution = await User.aggregate([
        { $group: { _id: '$planType', count: { $sum: 1 } } },
      ]);

      const result = { official: 0, custom: 0, free: 0 };
      distribution.forEach((item) => {
        if (item._id) result[item._id] = item.count;
      });

      return res.status(200).json(result);
    } catch (err) {
      console.error('Error fetching user plan distribution:', err);
      return res.status(500).json({ message: 'Error fetching user plan distribution' });
    }
  },

  getPaymentGatewayRevenue: async (req, res) => {
    try {
      const revenue = await Transaction.aggregate([
        { $match: { status: 'COMPLETED', 'paymentGateway.name': { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$paymentGateway.name',
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]);

      return res.status(200).json(revenue.map((r) => ({ gateway: r._id, revenue: r.revenue, count: r.count })));
    } catch (err) {
      console.error('Error fetching payment gateway revenue:', err);
      return res.status(500).json({ message: 'Error fetching payment gateway revenue' });
    }
  },

  getTransactionTypeBreakdown: async (req, res) => {
    try {
      const breakdown = await Transaction.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
      ]);

      const result = {};
      breakdown.forEach((item) => {
        result[item._id] = { count: item.count, totalAmount: item.totalAmount };
      });

      return res.status(200).json(result);
    } catch (err) {
      console.error('Error fetching transaction type breakdown:', err);
      return res.status(500).json({ message: 'Error fetching transaction type breakdown' });
    }
  },

  getKpiSummary: async (req, res) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [
        totalUsers,
        totalRevenue,
        totalTransactions,
        activeSubscriptions,
        blockedUsers,
        pendingRedemptions,
        previousMonthUsers,
        previousMonthRevenue,
        previousMonthTransactions,
      ] = await Promise.all([
        User.countDocuments(),
        Transaction.aggregate([
          { $match: { status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Transaction.countDocuments({ status: 'COMPLETED' }),
        Subscription.countDocuments({ status: 'active' }),
        User.countDocuments({ isBlocked: true }),
        SpecialDealRedemption.countDocuments({ status: 'pending' }),
        User.countDocuments({ createdAt: { $lt: startOfMonth } }),
        Transaction.aggregate([
          { $match: { status: 'COMPLETED', createdAt: { $lt: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
        Transaction.countDocuments({ status: 'COMPLETED', createdAt: { $lt: startOfMonth } }),
      ]);

      const totalUsersPrev = previousMonthUsers || 1;
      const totalRevenuePrev = previousMonthRevenue[0]?.total || 1;
      const totalTransactionsPrev = previousMonthTransactions || 1;
      const currentRevenue = totalRevenue[0]?.total || 0;

      const calcPct = (current, previous) =>
        previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : '0';

      return res.status(200).json({
        totalUsers,
        totalUsersPct: calcPct(totalUsers, totalUsersPrev),
        totalRevenue: currentRevenue,
        totalRevenuePct: calcPct(currentRevenue, totalRevenuePrev),
        totalTransactions,
        totalTransactionsPct: calcPct(totalTransactions, totalTransactionsPrev),
        activeSubscriptions,
        blockedUsers,
        pendingRedemptions,
      });
    } catch (err) {
      console.error('Error fetching KPI summary:', err);
      return res.status(500).json({ message: 'Error fetching KPI summary' });
    }
  },
};

module.exports = dataController;

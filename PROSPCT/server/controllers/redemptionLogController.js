const VoucherRedemptionLog = require("../models/VoucherRedemptionLog");

const redemptionLogController = {
  getRedemptionLogs: async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      const skip = (pageNumber - 1) * limitNumber;

      const filter = {};
      if (status && ["success", "failed"].includes(status)) {
        filter.status = status;
      }

      const [logs, totalCount] = await Promise.all([
        VoucherRedemptionLog.find(filter)
          .populate("userId", "firstName lastName email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .lean(),
        VoucherRedemptionLog.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        logs,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error fetching redemption logs:", error);
      return res.status(500).json({ success: false, message: "Error fetching redemption logs" });
    }
  },
};

module.exports = redemptionLogController;

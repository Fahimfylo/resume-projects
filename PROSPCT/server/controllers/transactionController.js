const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Plan = require("../models/Plans");

const transactionController = {
  getAllTransactions: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const transactions = await Transaction.find()
        .populate("userId", "email firstName lastName")
        .populate("items.plan.planId")
        .skip(skip)
        .limit(limit)
        .exec();

      const totalCount = await Transaction.countDocuments();

      res.status(200).json({
        success: true,
        transactions,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching transactions",
        error: error.message,
      });
    }
  },

  searchTransactions: async (req, res) => {
    const { searchQuery, page = 1, limit = 10 } = req.query;  // Get page and limit from query params
    if (!searchQuery || searchQuery.trim() === "") {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }
  
    try {
      const skip = (page - 1) * limit; // Calculate how many records to skip
  
      const searchRegex = new RegExp(searchQuery, "i");
  
      // Search with pagination, including totalAmount and plan.name
      const transactions = await Transaction.find({
        $or: [
          { "paymentGateway.name": searchRegex },
          { status: searchRegex },
          { type: searchRegex },
          { totalAmount: parseFloat(searchQuery) },  // Search for exact match with totalAmount
          { "items.plan.name": searchRegex },  // Search for plan name within the items array
        ],
      })
        .populate("userId", "email firstName lastName")
        .skip(skip)
        .limit(limit)
        .exec();
  
      const totalCount = await Transaction.countDocuments({
        $or: [
          { "paymentGateway.name": searchRegex },
          { status: searchRegex },
          { type: searchRegex },
          { totalAmount: parseFloat(searchQuery) },
          { "items.plan.name": searchRegex },
        ],
      });
  
      // Return the paginated results
      res.status(200).json({
        success: true,
        transactions,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error("Error searching transactions:", error);
      res.status(500).json({ success: false, message: "Error searching transactions", error: error.message });
    }
  },
  
  
  

  getTransactionById: async (req, res) => {
    const { transactionId } = req.params;
    try {
      const transaction = await Transaction.findById(transactionId)
        .populate("userId", "email firstName lastName")
        .populate("items.plan.planId");

      if (!transaction) {
        return res
          .status(404)
          .json({ success: false, message: "Transaction not found" });
      }

      res.status(200).json({ success: true, transaction });
    } catch (error) {
      console.error("Error fetching transaction by ID:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching transaction",
        error: error.message,
      });
    }
  },

  addTransaction: async (req, res) => {
    const { userId, type, status, totalAmount, items, paymentGateway, coupon } =
      req.body;

    try {
      // Validate user
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user ID" });
      }

      // Validate items
      if (!items || items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Transaction items are required" });
      }

      const transaction = new Transaction({
        userId,
        type,
        status,
        totalAmount,
        items,
        paymentGateway,
        coupon,
      });

      const savedTransaction = await transaction.save();
      res
        .status(201)
        .json({ success: true, message: "Transaction created successfully", transaction: savedTransaction });
    } catch (error) {
      console.error("Error adding transaction:", error);
      res.status(500).json({
        success: false,
        message: "Error creating transaction",
        error: error.message,
      });
    }
  },

  updateTransaction: async (req, res) => {
    const { transactionId } = req.params;
    const updates = req.body;

    try {
      const transaction = await Transaction.findByIdAndUpdate(
        transactionId,
        updates,
        { new: true, runValidators: true }
      );

      if (!transaction) {
        return res
          .status(404)
          .json({ success: false, message: "Transaction not found" });
      }

      res.status(200).json({
        success: true,
        message: "Transaction updated successfully",
        transaction,
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({
        success: false,
        message: "Error updating transaction",
        error: error.message,
      });
    }
  },

  deleteTransaction: async (req, res) => {
    const { transactionId } = req.params;

    try {
      const transaction = await Transaction.findByIdAndDelete(transactionId);

      if (!transaction) {
        return res
          .status(404)
          .json({ success: false, message: "Transaction not found" });
      }

      res.status(200).json({
        success: true,
        message: "Transaction deleted successfully",
        transaction,
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting transaction",
        error: error.message,
      });
    }
  },

  countTotalTransactions: async (req, res) => {
    try {
      const totalTransactions = await Transaction.countDocuments();

      res.status(200).json({
        success: true,
        message: "Total transactions counted successfully",
        totalTransactions,
      });
    } catch (error) {
      console.error("Error counting total transactions:", error);
      res.status(500).json({
        success: false,
        message: "Error counting transactions",
        error: error.message,
      });
    }
  },
  // Bulk delete transactions
  deleteAllTransactions: async (req, res) => {
    try {
        const result = await Transaction.deleteMany({});
        res.status(200).json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        console.error("Error deleting all transactions:", error);
        res.status(500).json({ success: false, message: "Error deleting all transactions", error: error.message });
    }
},
};

module.exports = transactionController;

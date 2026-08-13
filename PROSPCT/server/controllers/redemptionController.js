const SpecialDealRedemption = require("../models/SpecialDealRedemption");
const SpecialDeal = require("../models/SpecialDeal");
const User = require("../models/User");

const redemptionController = {
  requestRedemption: async (req, res) => {
    try {
      const { code } = req.body;
      const userId = req.user?.id || req.user?._id;

      if (!code) {
        return res.status(400).json({ success: false, message: "Redeem code is required." });
      }
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }

      const deal = await SpecialDeal.findOne({ code: code.toUpperCase() });
      if (!deal) {
        return res.status(404).json({ success: false, message: "Invalid redeem code." });
      }
      if (!deal.isActive) {
        return res.status(400).json({ success: false, message: "This redeem code is no longer active." });
      }
      if (deal.expiresAt && new Date(deal.expiresAt) < new Date()) {
        return res.status(400).json({ success: false, message: "This redeem code has expired." });
      }
      if (deal.maxRedeems > 0 && deal.timesRedeemed >= deal.maxRedeems) {
        return res.status(400).json({ success: false, message: "This redeem code has reached its usage limit." });
      }

      const existing = await SpecialDealRedemption.findOne({
        userId,
        dealId: deal._id,
        status: { $in: ["pending", "approved"] },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: existing.status === "pending"
            ? "You already have a pending request for this code."
            : "You have already redeemed this code.",
        });
      }

      const redemption = await SpecialDealRedemption.create({
        userId,
        dealId: deal._id,
        code: deal.code,
        status: "pending",
        credits: {
          emailCredits: deal.emailCredits,
          phoneCredits: deal.phoneCredits,
          verificationCredits: deal.verificationCredits,
          exportCredits: deal.exportCredits,
          emailSeats: deal.emailSeats,
        },
      });

      return res.status(201).json({
        success: true,
        message: "Redeem request submitted. Awaiting admin approval.",
        redemption,
      });
    } catch (error) {
      console.error("Error requesting redemption:", error);
      return res.status(500).json({ success: false, message: "Error requesting redemption", error: error.message });
    }
  },

  getPendingRequests: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      const skip = (pageNumber - 1) * limitNumber;
      const [requests, totalCount] = await Promise.all([
        SpecialDealRedemption.find({ status: "pending" })
          .populate("userId", "firstName lastName email company profilePicture")
          .populate("dealId", "code discount priceUSD originalPriceUSD")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .exec(),
        SpecialDealRedemption.countDocuments({ status: "pending" }),
      ]);

      return res.status(200).json({
        success: true,
        requests,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      return res.status(500).json({ success: false, message: "Error fetching pending requests", error: error.message });
    }
  },

  approveRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || req.admin?._id;

      const redemption = await SpecialDealRedemption.findById(id).populate("dealId");
      if (!redemption) {
        return res.status(404).json({ success: false, message: "Redemption request not found." });
      }
      if (redemption.status !== "pending") {
        return res.status(400).json({ success: false, message: "This request has already been processed." });
      }

      const deal = redemption.dealId;
      const user = await User.findById(redemption.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      const dealEmail = deal.emailCredits || 0;
      const dealPhone = deal.phoneCredits || 0;
      const dealVerification = deal.verificationCredits || 0;
      const dealExport = deal.exportCredits || 0;
      const maxCredits = Math.max(dealEmail, dealPhone, dealVerification, dealExport);

      const creditIncrements = {};
      if (maxCredits > 0) {
        creditIncrements["credits.emailCredits.current"] = dealEmail || maxCredits;
        creditIncrements["credits.emailCredits.max"] = dealEmail || maxCredits;
        creditIncrements["credits.phoneCredits.current"] = dealPhone || maxCredits;
        creditIncrements["credits.phoneCredits.max"] = dealPhone || maxCredits;
        creditIncrements["credits.verificationCredits.current"] = dealVerification || maxCredits;
        creditIncrements["credits.verificationCredits.max"] = dealVerification || maxCredits;
        creditIncrements["credits.exportCredits.current"] = dealExport || maxCredits;
        creditIncrements["credits.exportCredits.max"] = dealExport || maxCredits;
      }

      const dealName = deal.codes
        ? `${deal.codes} Code${deal.codes > 1 ? 's' : ''} package`
        : (deal.code || deal.description || "");
      await User.findByIdAndUpdate(redemption.userId, {
        $inc: creditIncrements,
        $set: {
          redeemedDeal: dealName,
          planType: "custom",
          "limits.csvEnrichment": true,
          "limits.technologyFilter": true,
          "limits.jobPostingFilter": true,
          "limits.revenueFilter": true,
          "limits.fundingFilter": true,
          "limits.basicIntegrations": true,
          "limits.jobChangeFilter": true,
          "limits.duplicateControl": true,
          "limits.hubspotIntegration": true,
          "limits.salesforceIntegration": true,
          "limits.jobChangeTracking": true,
        },
      });
      deal.timesRedeemed += 1;
      await deal.save();

      redemption.status = "approved";
      redemption.approvedAt = new Date();
      redemption.approvedBy = adminId;
      await redemption.save();

      return res.status(200).json({
        success: true,
        message: "Redemption approved and credits granted.",
        redemption,
      });
    } catch (error) {
      console.error("Error approving redemption:", error);
      return res.status(500).json({ success: false, message: "Error approving redemption", error: error.message });
    }
  },

  rejectRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const redemption = await SpecialDealRedemption.findById(id);
      if (!redemption) {
        return res.status(404).json({ success: false, message: "Redemption request not found." });
      }
      if (redemption.status !== "pending") {
        return res.status(400).json({ success: false, message: "This request has already been processed." });
      }

      redemption.status = "rejected";
      await redemption.save();

      return res.status(200).json({
        success: true,
        message: "Redemption request rejected.",
        redemption,
      });
    } catch (error) {
      console.error("Error rejecting redemption:", error);
      return res.status(500).json({ success: false, message: "Error rejecting redemption", error: error.message });
    }
  },

  getAssigned: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      const skip = (pageNumber - 1) * limitNumber;
      const [assignments, totalCount] = await Promise.all([
        SpecialDealRedemption.find({ status: { $in: ["approved", "suspended"] } })
          .populate("userId", "firstName lastName email company profilePicture")
          .populate("dealId", "code discount priceUSD originalPriceUSD")
          .sort({ approvedAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .exec(),
        SpecialDealRedemption.countDocuments({ status: { $in: ["approved", "suspended"] } }),
      ]);

      return res.status(200).json({
        success: true,
        assignments,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error fetching assigned:", error);
      return res.status(500).json({ success: false, message: "Error fetching assigned", error: error.message });
    }
  },

  suspendAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const redemption = await SpecialDealRedemption.findById(id);
      if (!redemption) {
        return res.status(404).json({ success: false, message: "Assignment not found." });
      }
      if (redemption.status !== "approved") {
        return res.status(400).json({ success: false, message: "Only approved assignments can be suspended." });
      }

      redemption.status = "suspended";
      redemption.suspendedAt = new Date();
      await redemption.save();

      return res.status(200).json({
        success: true,
        message: "Assignment suspended.",
        redemption,
      });
    } catch (error) {
      console.error("Error suspending assignment:", error);
      return res.status(500).json({ success: false, message: "Error suspending assignment", error: error.message });
    }
  },

  unsuspendAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const redemption = await SpecialDealRedemption.findById(id);
      if (!redemption) {
        return res.status(404).json({ success: false, message: "Assignment not found." });
      }
      if (redemption.status !== "suspended") {
        return res.status(400).json({ success: false, message: "Only suspended assignments can be unsuspended." });
      }

      redemption.status = "approved";
      redemption.suspendedAt = undefined;
      await redemption.save();

      return res.status(200).json({
        success: true,
        message: "Assignment unsuspended.",
        redemption,
      });
    } catch (error) {
      console.error("Error unsuspending assignment:", error);
      return res.status(500).json({ success: false, message: "Error unsuspending assignment", error: error.message });
    }
  },

  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const redemption = await SpecialDealRedemption.findByIdAndDelete(id);
      if (!redemption) {
        return res.status(404).json({ success: false, message: "Assignment not found." });
      }

      return res.status(200).json({
        success: true,
        message: "Assignment deleted.",
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      return res.status(500).json({ success: false, message: "Error deleting assignment", error: error.message });
    }
  },
};

module.exports = redemptionController;

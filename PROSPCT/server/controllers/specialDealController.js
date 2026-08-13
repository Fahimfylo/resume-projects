const SpecialDeal = require("../models/SpecialDeal");
const User = require("../models/User");

const specialDealController = {
  createSpecialDeal: async (req, res) => {
    try {
      const { code, description, codes, discount, priceUSD, originalPriceUSD, priceBDT, emailCredits, phoneCredits, verificationCredits, exportCredits, emailSeats, isActive, maxRedeems, expiresAt } = req.body;

      const existing = await SpecialDeal.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: "A special deal with this code already exists." });
      }

      const newDeal = new SpecialDeal({
        code,
        description,
        codes: codes || 1,
        discount: discount || "",
        priceUSD: priceUSD || 0,
        originalPriceUSD: originalPriceUSD || 0,
        priceBDT: priceBDT || 0,
        emailCredits: emailCredits || 0,
        phoneCredits: phoneCredits || 0,
        verificationCredits: verificationCredits || 0,
        exportCredits: exportCredits || 0,
        emailSeats: emailSeats || 0,
        isActive: isActive !== undefined ? isActive : true,
        maxRedeems: maxRedeems || 1,
        expiresAt,
      });

      await newDeal.save();
      res.status(201).json({ success: true, message: "Special deal created successfully", deal: newDeal });
    } catch (error) {
      console.error("Error creating special deal:", error);
      res.status(500).json({ success: false, message: "Error creating special deal", error: error.message });
    }
  },

  getAllSpecialDeals: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      if (isNaN(pageNumber) || pageNumber <= 0) {
        return res.status(400).json({ success: false, message: "Invalid page number" });
      }
      if (isNaN(limitNumber) || limitNumber <= 0) {
        return res.status(400).json({ success: false, message: "Invalid limit value" });
      }

      const skip = (pageNumber - 1) * limitNumber;
      const deals = await SpecialDeal.find()
        .sort({ codes: 1 })
        .skip(skip)
        .limit(limitNumber)
        .exec();

      const totalCount = await SpecialDeal.countDocuments();

      return res.status(200).json({
        success: true,
        deals,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error fetching special deals:", error);
      return res.status(500).json({ success: false, message: "Error fetching special deals", error: error.message });
    }
  },

  getSpecialDealsBySearch: async (req, res) => {
    try {
      const { searchQuery = "", page = 1, limit = 20 } = req.query;
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      if (pageNumber <= 0 || limitNumber <= 0) {
        return res.status(400).json({ success: false, message: "Invalid pagination values" });
      }

      const searchConditions = {
        code: { $regex: searchQuery, $options: "i" },
      };

      const skip = (pageNumber - 1) * limitNumber;
      const deals = await SpecialDeal.find(searchConditions)
        .sort({ codes: 1 })
        .skip(skip)
        .limit(limitNumber)
        .exec();

      const totalCount = await SpecialDeal.countDocuments(searchConditions);

      if (deals.length === 0) {
        return res.status(404).json({ success: false, message: "No special deals found matching your search." });
      }

      return res.status(200).json({
        success: true,
        deals,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error searching special deals:", error);
      return res.status(500).json({ success: false, message: "Error searching special deals", error: error.message });
    }
  },

  getSpecialDealById: async (req, res) => {
    try {
      const { id } = req.params;
      const deal = await SpecialDeal.findById(id);

      if (!deal) {
        return res.status(404).json({ success: false, message: "Special deal not found" });
      }

      return res.status(200).json({ success: true, deal });
    } catch (error) {
      console.error("Error fetching special deal:", error);
      return res.status(500).json({ success: false, message: "Error fetching special deal", error: error.message });
    }
  },

  updateSpecialDeal: async (req, res) => {
    try {
      const { id } = req.params;
      const { code, description, codes, discount, priceUSD, originalPriceUSD, priceBDT, emailCredits, phoneCredits, verificationCredits, exportCredits, emailSeats, isActive, maxRedeems, expiresAt } = req.body;

      const deal = await SpecialDeal.findByIdAndUpdate(
        id,
        { code, description, codes, discount, priceUSD, originalPriceUSD, priceBDT, emailCredits, phoneCredits, verificationCredits, exportCredits, emailSeats, isActive, maxRedeems, expiresAt },
        { new: true }
      );

      if (!deal) {
        return res.status(404).json({ success: false, message: "Special deal not found" });
      }

      res.json({ success: true, message: "Special deal updated successfully", deal });
    } catch (error) {
      console.error("Error updating special deal:", error);
      res.status(500).json({ success: false, message: "Error updating special deal", error: error.message });
    }
  },

  deleteSpecialDeal: async (req, res) => {
    try {
      const { id } = req.params;
      const deal = await SpecialDeal.findByIdAndDelete(id);

      if (!deal) {
        return res.status(404).json({ success: false, message: "Special deal not found" });
      }

      res.json({ success: true, message: "Special deal deleted successfully" });
    } catch (error) {
      console.error("Error deleting special deal:", error);
      res.status(500).json({ success: false, message: "Error deleting special deal", error: error.message });
    }
  },

  redeemSpecialDeal: async (req, res) => {
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

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      const emailCredits = deal.emailCredits || 0;
      const phoneCredits = deal.phoneCredits || 0;
      const verificationCredits = deal.verificationCredits || 0;
      const exportCredits = deal.exportCredits || 0;
      const maxCredits = Math.max(emailCredits, phoneCredits, verificationCredits, exportCredits);

      const creditIncrements = {};
      if (maxCredits > 0) {
        creditIncrements["credits.emailCredits.current"] = emailCredits || maxCredits;
        creditIncrements["credits.emailCredits.max"] = emailCredits || maxCredits;
        creditIncrements["credits.phoneCredits.current"] = phoneCredits || maxCredits;
        creditIncrements["credits.phoneCredits.max"] = phoneCredits || maxCredits;
        creditIncrements["credits.verificationCredits.current"] = verificationCredits || maxCredits;
        creditIncrements["credits.verificationCredits.max"] = verificationCredits || maxCredits;
        creditIncrements["credits.exportCredits.current"] = exportCredits || maxCredits;
        creditIncrements["credits.exportCredits.max"] = exportCredits || maxCredits;
      }

      if (Object.keys(creditIncrements).length === 0) {
        return res.status(400).json({ success: false, message: "This redeem code has no credits to grant." });
      }

      const grantedCredits = maxCredits > 0 ? maxCredits : 0;

      const dealName = deal.codes
        ? `${deal.codes} Code${deal.codes > 1 ? 's' : ''} package`
        : (deal.code || deal.description || "");
      await User.findByIdAndUpdate(userId, {
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

      return res.status(200).json({
        success: true,
        message: "Redeem code applied successfully! Credits have been added to your account.",
        credits: {
          emailCredits: grantedCredits,
          phoneCredits: grantedCredits,
          verificationCredits: grantedCredits,
          exportCredits: grantedCredits,
        },
      });
    } catch (error) {
      console.error("Error redeeming special deal:", error);
      return res.status(500).json({ success: false, message: "Error redeeming code", error: error.message });
    }
  },
};

module.exports = specialDealController;

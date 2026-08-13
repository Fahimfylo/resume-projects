const Coupon = require("../models/Coupon");

const couponController = {
  // Create a new coupon
  createCoupon: async (req, res) => {
    const { code, discountPercentage, isActive, validUntil, usageLimit } = req.body;

    try {
      const newCoupon = new Coupon({
        code,
        discountPercentage,
        isActive,
        validUntil,
        usageLimit,
      });

      await newCoupon.save();
      res.status(201).json({ message: "Coupon created successfully", coupon: newCoupon });
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ error: "Error creating coupon" });
    }
  },

  getAllCoupons: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      if (isNaN(pageNumber) || pageNumber <= 0) {
        return res.status(400).json({ success: false, message: "Invalid page number" });
      }

      if (isNaN(limitNumber) || limitNumber <= 0) {
        return res.status(400).json({ success: false, message: "Invalid limit value" });
      }

      const skip = (pageNumber - 1) * limitNumber;
      const coupons = await Coupon.find()
        .skip(skip)
        .limit(limitNumber)
        .exec();

      const totalCount = await Coupon.countDocuments();

      return res.status(200).json({
        success: true,
        coupons,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error fetching coupons:", error);
      return res.status(500).json({ success: false, message: "Error fetching coupons", error: error.message });
    }
  },

  // Get coupons by search with pagination
  getCouponsBySearch: async (req, res) => {
    try {
      const { searchQuery = "", page = 1, limit = 10 } = req.query;

      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      if (pageNumber <= 0 || limitNumber <= 0) {
        return res.status(400).json({ success: false, message: "Invalid pagination values" });
      }

      const searchConditions = {
        code: { $regex: searchQuery, $options: "i" },
      };

      const skip = (pageNumber - 1) * limitNumber;
      const coupons = await Coupon.find(searchConditions)
        .skip(skip)
        .limit(limitNumber)
        .exec();

      const totalCount = await Coupon.countDocuments(searchConditions);

      if (coupons.length === 0) {
        return res.status(404).json({ success: false, message: "No coupons found matching your search." });
      }

      return res.status(200).json({
        success: true,
        coupons,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error searching coupons:", error);
      return res.status(500).json({ success: false, message: "Error searching coupons", error: error.message });
    }
  },

  // Toggle coupon active status
  toggleIsActive: async (req, res) => {
    const { couponId } = req.params;
    const { isActive } = req.body;

    try {
      const coupon = await Coupon.findById(couponId);

      if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }

      coupon.isActive = typeof isActive !== "undefined" ? isActive : !coupon.isActive;
      const updatedCoupon = await coupon.save();

      return res.status(200).json({
        success: true,
        message: "Coupon isActive status updated successfully",
        coupon: updatedCoupon,
      });
    } catch (error) {
      console.error("Error updating isActive status:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating isActive status",
        error: error.message,
      });
    }
  },

  getCouponById: async (req, res) => {
    try {
      const { id } = req.params;
      const coupon = await Coupon.findById(id);

      if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }

      return res.status(200).json({ success: true, coupon });
    } catch (error) {
      console.error("Error fetching coupon by ID:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching coupon",
        error: error.message,
      });
    }
  },

  // Update a coupon
  updateCoupon: async (req, res) => {
    const { id } = req.params;
    const { code, discountPercentage, isActive, validUntil, usageLimit } = req.body;

    try {
      const coupon = await Coupon.findByIdAndUpdate(
        id,
        { code, discountPercentage, isActive, validUntil, usageLimit },
        { new: true } // Return the updated document
      );

      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }

      res.json({ message: "Coupon updated successfully", coupon });
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({ error: "Error updating coupon" });
    }
  },

  // Delete a coupon
  deleteCoupon: async (req, res) => {
    const { id } = req.params;

    try {
      const coupon = await Coupon.findByIdAndDelete(id);

      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }

      res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ error: "Error deleting coupon" });
    }
  },

  // Validate and get a coupon by its code (user-facing)
  getCouponWithCode: async (req, res) => {
    const { couponCode } = req.params;

    try {
      const coupon = await Coupon.findOne({
        code: { $regex: `^${couponCode}$`, $options: "i" },
      });

      if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }

      if (!coupon.isActive) {
        return res.status(400).json({ success: false, message: "This coupon is no longer active" });
      }

      if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
        return res.status(400).json({ success: false, message: "This coupon has expired" });
      }

      if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) {
        return res.status(400).json({ success: false, message: "This coupon has reached its usage limit" });
      }

      return res.status(200).json({ success: true, coupon });
    } catch (error) {
      console.error("Error fetching coupon by code:", error);
      return res.status(500).json({ success: false, message: "Error fetching coupon by code", error: error.message });
    }
  },
};

module.exports = couponController;

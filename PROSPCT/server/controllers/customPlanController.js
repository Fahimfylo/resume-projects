const CustomPlan = require("../models/CustomPlan");
const User = require("../models/User");
const Plans = require("../models/Plans");
const Subscription = require("../models/Subscription");
const { applyPlanToUser } = require("../services/planService");
const { expireUserSubscriptions, calculateEndDate, mapBillingCycleForSubscription } = require("../services/subscriptionService");

const customPlanControllers = {
  /**
   * --------------------------------
   * GET ALL CUSTOM PLANS
   * --------------------------------
   */
  getCustomPlans: async (req, res) => {
    try {
      let { page = 1, limit = 10 } = req.query;

      page = parseInt(page, 10);
      limit = parseInt(limit, 10);

      if (isNaN(page) || page <= 0 || isNaN(limit) || limit <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid pagination values.",
        });
      }

      const skip = (page - 1) * limit;

      const plans = await CustomPlan.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const totalCount = await CustomPlan.countDocuments();

      res.status(200).json({
        success: true,
        plans,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching custom plans.",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * GET CUSTOM PLAN BY ID
   * --------------------------------
   */
  getCustomPlanById: async (req, res) => {
    try {
      const { id } = req.params;

      const plan = await CustomPlan.findById(id);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Custom plan not found",
        });
      }

      res.status(200).json({
        success: true,
        plan,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  },

  /**
   * --------------------------------
   * ADD CUSTOM PLAN
   * --------------------------------
   */
  addCustomPlan: async (req, res) => {
    try {
      const {
        name,
        description,
        pricing,
        features,
        status,
        recommended,
        duration,
        assigned,
        maxUsers,
      } = req.body;

      if (!name || !pricing || !features) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const calcFinal = (price, discount) =>
        Math.round((price - (price * discount) / 100) * 100) / 100;

      const pricingWithFinal = {
        monthly: {
          price: pricing.monthly.price,
          discount: pricing.monthly.discount,
          finalPrice: calcFinal(pricing.monthly.price, pricing.monthly.discount),
        },
        yearly: {
          price: pricing.yearly.price,
          discount: pricing.yearly.discount,
          finalPrice: calcFinal(pricing.yearly.price, pricing.yearly.discount),
        },
      };

      const newPlan = await CustomPlan.create({
        name,
        description,
        pricing: pricingWithFinal,
        features,
        status: status || "active",
        type: "custom",
        recommended: recommended || false,
        duration,
        assigned: assigned || [],
        maxUsers: maxUsers || 1,
      });

      // Process assigned users: remove from old plans and assign to this plan
      if (assigned && assigned.length > 0) {
        const now = new Date();
        const billingCycle = mapBillingCycleForSubscription(newPlan.duration || 'yearly');
        const endDate = calculateEndDate(billingCycle, now);

        for (const email of assigned) {
          const user = await User.findOne({ email });
          if (!user) continue;

          if (user.plan) {
            await Plans.findByIdAndUpdate(user.plan, {
              $pull: { assigned: email },
              updatedAt: now,
            });
            await CustomPlan.findByIdAndUpdate(user.plan, {
              $pull: { assigned: email },
              updatedAt: now,
            });
          }

          await applyPlanToUser(user._id, newPlan, "custom");

          // Create subscription
          await expireUserSubscriptions(user._id);
          const newSubscription = new Subscription({
            user: user._id,
            plan: newPlan._id,
            planModel: 'CustomPlan',
            startDate: now,
            endDate,
            status: 'active',
            billingCycle,
          });
          const savedSubscription = await newSubscription.save();
          await User.findByIdAndUpdate(user._id, { subscription: savedSubscription._id });
        }
      }

      res.status(201).json({
        success: true,
        message: "Custom plan added successfully",
        plan: newPlan,
      });
    } catch (error) {
      if (error.code === 11000 || error.message.includes("duplicate key")) {
        const planName = req.body.name || "This plan";
        return res.status(400).json({
          success: false,
          message: `${planName} plan already exists`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Error adding custom plan",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * UPDATE CUSTOM PLAN
   * --------------------------------
   */
  updateCustomPlan: async (req, res) => {
    try {
      const { id } = req.params;

      // Get current plan to compare assigned lists
      const currentPlan = await CustomPlan.findById(id);
      if (!currentPlan) {
        return res.status(404).json({ success: false, message: "Custom plan not found" });
      }

      const { assigned, ...planData } = req.body;
      const oldAssigned = currentPlan.assigned || [];
      const newAssigned = assigned || [];

      // Users removed from this plan
      const removedUsers = oldAssigned.filter((email) => !newAssigned.includes(email));
      for (const email of removedUsers) {
        const user = await User.findOne({ email });
        if (user && user.plan && user.plan.toString() === id) {
          await User.findByIdAndUpdate(user._id, {
            $unset: { plan: 1, planType: 1, subscription: 1 },
            $set: {
              credits: {
                emailCredits: { current: 0, max: 0 },
                phoneCredits: { current: 0, max: 0 },
                verificationCredits: { current: 0, max: 0 },
                exportCredits: { current: 0, max: 0 },
              },
              updatedAt: new Date(),
            },
          });
          await expireUserSubscriptions(user._id);
        }
      }

      // Users newly added to this plan
      const addedUsers = newAssigned.filter((email) => !oldAssigned.includes(email));
      const now = new Date();
      const billingCycle = mapBillingCycleForSubscription(currentPlan.duration || 'yearly');
      const endDate = calculateEndDate(billingCycle, now);

      for (const email of addedUsers) {
        const user = await User.findOne({ email });
        if (!user) continue;

        // Remove from old plan
        if (user.plan && user.plan.toString() !== id) {
          await Plans.findByIdAndUpdate(user.plan, {
            $pull: { assigned: email },
            updatedAt: now,
          });
          await CustomPlan.findByIdAndUpdate(user.plan, {
            $pull: { assigned: email },
            updatedAt: now,
          });
        }

        // Apply this plan to user
        const planForUser = {
          _id: id,
          name: planData.name || currentPlan.name,
          features: planData.features || currentPlan.features,
        };
        await applyPlanToUser(user._id, planForUser, "custom");

        // Create subscription
        await expireUserSubscriptions(user._id);
        const newSubscription = new Subscription({
          user: user._id,
          plan: id,
          planModel: 'CustomPlan',
          startDate: now,
          endDate,
          status: 'active',
          billingCycle,
        });
        const savedSubscription = await newSubscription.save();
        await User.findByIdAndUpdate(user._id, { subscription: savedSubscription._id });
      }

      // Build update data
      let updateData = { ...planData, assigned: newAssigned };
      if (req.body.pricing) {
        const calcFinal = (price, discount) =>
          Math.round((price - (price * discount) / 100) * 100) / 100;

        updateData.pricing = {
          monthly: {
            price: req.body.pricing.monthly?.price || 0,
            discount: req.body.pricing.monthly?.discount || 0,
            finalPrice: calcFinal(
              req.body.pricing.monthly?.price || 0,
              req.body.pricing.monthly?.discount || 0,
            ),
          },
          yearly: {
            price: req.body.pricing.yearly?.price || 0,
            discount: req.body.pricing.yearly?.discount || 0,
            finalPrice: calcFinal(
              req.body.pricing.yearly?.price || 0,
              req.body.pricing.yearly?.discount || 0,
            ),
          },
        };
      }

      const updatedPlan = await CustomPlan.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      // Sync credits for assigned users
      const features = updatedPlan.features || {};
      const credits = {
        emailCredits: { current: features.emailCredits?.max || 0, max: features.emailCredits?.max || 0 },
        phoneCredits: { current: features.phoneCredits?.max || 0, max: features.phoneCredits?.max || 0 },
        verificationCredits: { current: features.verificationCredits?.max || 0, max: features.verificationCredits?.max || 0 },
        exportCredits: { current: features.exportCredits?.max || 0, max: features.exportCredits?.max || 0 },
      };

      if (newAssigned.length > 0) {
        await User.updateMany(
          { email: { $in: newAssigned } },
          {
            $set: {
              credits,
              updatedAt: new Date(),
              planType: "custom",
            },
          },
        );
      }

      res.json({
        success: true,
        message: "Custom plan updated successfully",
        plan: updatedPlan,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating custom plan",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * DELETE CUSTOM PLAN
   * --------------------------------
   */
  deleteCustomPlan: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedPlan = await CustomPlan.findByIdAndDelete(id);
      if (!deletedPlan)
        return res
          .status(404)
          .json({ success: false, message: "Custom plan not found" });

      // Expire subscriptions for all users assigned to this plan
      const assignedEmails = deletedPlan.assigned || [];
      for (const email of assignedEmails) {
        const user = await User.findOne({ email });
        if (user) {
          await expireUserSubscriptions(user._id);
          await User.findByIdAndUpdate(user._id, {
            $unset: { plan: 1, planType: 1, subscription: 1 },
            $set: {
              credits: {
                emailCredits: { current: 0, max: 0 },
                phoneCredits: { current: 0, max: 0 },
                verificationCredits: { current: 0, max: 0 },
                exportCredits: { current: 0, max: 0 },
              },
              updatedAt: new Date(),
            },
          });
        }
      }

      res.json({
        success: true,
        message: "Custom plan deleted successfully",
        plan: deletedPlan,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting custom plan",
        error: error.message,
      });
    }
  },
};

module.exports = customPlanControllers;

const Subscription = require("../models/Subscription");
const User = require("../models/User");
const Plan = require("../models/Plans");
const CustomPlan = require("../models/CustomPlan");
const Team = require("../models/Team");
const { applyPlanToUser, removePlanFromUser } = require('../services/planService');
const { expireUserSubscriptions, clearUserSubscriptionRef } = require('../services/subscriptionService');

const subscriptionController = {
  // Get all subscriptions with pagination
  getAllSubscriptions: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;

      if (pageNumber <= 0 || limitNumber <= 0) {
        return res.status(400).json({ success: false, message: "Invalid pagination values." });
      }

      const skip = (pageNumber - 1) * limitNumber;

      const subscriptions = await Subscription.find()
        .skip(skip)
        .limit(limitNumber)
        .populate("user", "email firstName lastName")
        .populate("plan", "name type totalAmount")
        .exec();

      const totalCount = await Subscription.countDocuments();

      res.status(200).json({
        success: true,
        subscriptions,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ success: false, message: "Error fetching subscriptions", error: error.message });
    }
  },

  // Get a single subscription by ID
  getSubscriptionById: async (req, res) => {
    const { subscriptionId } = req.params;

    try {
      const subscription = await Subscription.findById(subscriptionId)
        .populate("user", "email firstName lastName")
        .populate("plan", "name features")
        .exec();

      if (!subscription) {
        return res.status(404).json({ success: false, message: "Subscription not found" });
      }

      res.status(200).json({ success: true, subscription });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ success: false, message: "Error fetching subscription", error: error.message });
    }
  },

  // Add a new subscription
  addSubscription: async (req, res) => {
    const { userId, planId, startDate, endDate, status, billingCycle } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      let plan = await Plan.findById(planId);
      let planModel = 'Plan';
      let planType = 'official';

      if (!plan) {
        plan = await CustomPlan.findById(planId);
        if (!plan) {
          return res.status(404).json({ success: false, message: "Plan not found" });
        }
        planModel = 'CustomPlan';
        planType = 'custom';
      }

      if (plan.status !== 'active') {
        return res.status(400).json({ success: false, message: "Only active plans can be assigned to users" });
      }

      const now = new Date();

      if (status === 'active') {
        await expireUserSubscriptions(userId);
      }

      const newSubscription = new Subscription({
        user: userId,
        plan: planId,
        planModel: planModel,
        startDate: startDate || now,
        endDate,
        status: status || "active",
        billingCycle: billingCycle || "monthly",
      });

      const savedSubscription = await newSubscription.save();

      if (status === 'active' || !status) {
        await applyPlanToUser(userId, plan, planType);

        if (planModel === 'Plan') {
          await Plan.findByIdAndUpdate(
            planId,
            { $addToSet: { assigned: user.email }, updatedAt: now },
            { new: true }
          );
          await CustomPlan.updateMany(
            { assigned: user.email },
            { $pull: { assigned: user.email } }
          );
        } else {
          await CustomPlan.findByIdAndUpdate(
            planId,
            { $addToSet: { assigned: user.email }, updatedAt: now },
            { new: true }
          );
          await Plan.updateMany(
            { assigned: user.email },
            { $pull: { assigned: user.email } }
          );
        }

        const team = await Team.findOne({ owner: userId });
        if (team) {
          team.purchasedPlan = planId;
          team.maxUsers = plan.maxUsers || 1;
          await team.save();
        }

        await User.findByIdAndUpdate(
          userId,
          { subscription: savedSubscription._id },
          { new: true }
        );
      }

      res.status(201).json({ success: true, message: "Subscription created successfully", subscription: savedSubscription });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ success: false, message: "Error creating subscription", error: error.message });
    }
  },

  // Update a subscription by ID
  updateSubscription: async (req, res) => {
    const { subscriptionId } = req.params;
    const updates = req.body;

    try {
      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return res.status(404).json({ success: false, message: "Subscription not found" });
      }

      const wasActive = subscription.status === 'active';
      const willBeActive = updates.status === 'active';
      const userId = subscription.user;
      const now = new Date();

      Object.keys(updates).forEach((key) => {
        if (key !== 'user' && key !== 'plan' && key !== 'planModel') {
          subscription[key] = updates[key];
        }
      });

      const updatedSubscription = await subscription.save();

      if (!wasActive && willBeActive) {
        await expireUserSubscriptions(userId, subscriptionId);

        let plan = null;
        let planType = 'official';
        
        if (subscription.planModel === 'Plan') {
          plan = await Plan.findById(subscription.plan);
        } else {
          plan = await CustomPlan.findById(subscription.plan);
          planType = 'custom';
        }

        if (plan) {
          const user = await User.findById(userId);
          await applyPlanToUser(userId, plan, planType);
          
          if (user && user.email) {
            if (subscription.planModel === 'Plan') {
              await Plan.findByIdAndUpdate(
                subscription.plan,
                { $addToSet: { assigned: user.email }, updatedAt: now },
                { new: true }
              );
              await CustomPlan.updateMany(
                { assigned: user.email },
                { $pull: { assigned: user.email } }
              );
            } else {
              await CustomPlan.findByIdAndUpdate(
                subscription.plan,
                { $addToSet: { assigned: user.email }, updatedAt: now },
                { new: true }
              );
              await Plan.updateMany(
                { assigned: user.email },
                { $pull: { assigned: user.email } }
              );
            }
          }

          const team = await Team.findOne({ owner: userId });
          if (team) {
            team.purchasedPlan = subscription.plan;
            if (plan) team.maxUsers = plan.maxUsers || 1;
            await team.save();
          }
        }

        await User.findByIdAndUpdate(
          userId,
          { subscription: subscriptionId },
          { new: true }
        );
      } else if (wasActive && !willBeActive && updates.status) {
        const user = await User.findById(userId);
        if (user && user.subscription && user.subscription.toString() === subscriptionId) {
          await removePlanFromUser(userId);
          await clearUserSubscriptionRef(userId);

          if (user.email) {
            await Plan.updateMany(
              { assigned: user.email },
              { $pull: { assigned: user.email } }
            );
            await CustomPlan.updateMany(
              { assigned: user.email },
              { $pull: { assigned: user.email } }
            );
          }

          const team = await Team.findOne({ owner: userId });
          if (team) {
            team.purchasedPlan = null;
            await team.save();
          }
        }
      }

      res.status(200).json({ success: true, message: "Subscription updated successfully", subscription: updatedSubscription });
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ success: false, message: "Error updating subscription", error: error.message });
    }
  },

  // Delete a subscription by ID
  deleteSubscription: async (req, res) => {
    const { subscriptionId } = req.params;

    try {
      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return res.status(404).json({ success: false, message: "Subscription not found" });
      }

      const userId = subscription.user;
      const user = await User.findById(userId);

      await Subscription.findByIdAndDelete(subscriptionId);

      if (user && user.subscription && user.subscription.toString() === subscriptionId) {
        await removePlanFromUser(userId);
        await clearUserSubscriptionRef(userId);

        if (user.email) {
          await Plan.updateMany(
            { assigned: user.email },
            { $pull: { assigned: user.email } }
          );
          await CustomPlan.updateMany(
            { assigned: user.email },
            { $pull: { assigned: user.email } }
          );
        }

        const team = await Team.findOne({ owner: userId });
        if (team) {
          team.purchasedPlan = null;
          await team.save();
        }
      }

      res.status(200).json({ success: true, message: "Subscription deleted successfully", subscription });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ success: false, message: "Error deleting subscription", error: error.message });
    }
  },

  // Count total subscriptions
  countTotalSubscriptions: async (req, res) => {
    try {
      const totalSubscriptions = await Subscription.countDocuments();

      res.status(200).json({
        success: true,
        message: "Total subscriptions counted successfully",
        totalSubscriptions,
      });
    } catch (error) {
      console.error("Error counting subscriptions:", error);
      res.status(500).json({ success: false, message: "Error counting subscriptions", error: error.message });
    }
  },

  // Get subscriptions by user ID
  getSubscriptionsByUserId: async (req, res) => {
    const { userId } = req.params;

    try {
      const subscriptions = await Subscription.find({ user: userId })
        .populate("plan", "name features")
        .exec();

      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({ success: false, message: "No subscriptions found for the user" });
      }

      res.status(200).json({ success: true, subscriptions });
    } catch (error) {
      console.error("Error fetching subscriptions by user ID:", error);
      res.status(500).json({ success: false, message: "Error fetching subscriptions by user ID", error: error.message });
    }
  },


  // Delete all subscriptions
  deleteAllSubscriptions: async (req, res) => {
    try {
      const result = await Subscription.deleteMany({});
      res.status(200).json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
      console.error("Error deleting all subscriptions:", error);
      res.status(500).json({ success: false, message: "Error deleting all subscriptions", error: error.message });
    }
  },

  // Get subscriptions by search criteria
  getSubscriptionsBySearch: async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }

    try {
      const searchRegex = new RegExp(query, "i"); // Case-insensitive regex

      const subscriptions = await Subscription.find({
        $or: [
          { "user.firstName": searchRegex },
          { "user.lastName": searchRegex },
          { "plan.name": searchRegex },
          { status: searchRegex },
        ],
      })
        .populate("user", "email firstName lastName")
        .populate("plan", "name features")
        .exec();

      if (!subscriptions || subscriptions.length === 0) {
        return res.status(404).json({ success: false, message: "No subscriptions found for the search query." });
      }

      res.status(200).json({ success: true, subscriptions });
    } catch (error) {
      console.error("Error fetching subscriptions by search query:", error);
      res.status(500).json({ success: false, message: "Error fetching subscriptions by search query", error: error.message });
    }
  }
};

module.exports = subscriptionController;

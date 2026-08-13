const Plan = require('../models/Plans');
const CustomPlan = require('../models/CustomPlan');
const User = require('../models/User');
const Team = require('../models/Team');
const Subscription = require('../models/Subscription');
const { applyPlanToUser, removePlanFromUser } = require('../services/planService');
const { calculateEndDate, mapBillingCycleForSubscription, expireUserSubscriptions, clearUserSubscriptionRef } = require('../services/subscriptionService');

/**
 * Assign custom plan to user
 * POST /api/admin/assign-custom-plan
 */
const assignCustomPlan = async (req, res) => {
  try {
    const { userId, planId, email } = req.body;

    // Data validation
    if (!userId || !planId || !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID, Plan ID, and email are required'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find custom plan
    const customPlan = await CustomPlan.findById(planId);
    if (!customPlan) {
      return res.status(404).json({
        success: false,
        message: 'Custom plan not found'
      });
    }

    // Check if plan is active
    if (customPlan.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active plans can be assigned to users'
      });
    }

    // Check if email matches user email
    if (user.email !== email) {
      return res.status(400).json({
        success: false,
        message: 'Provided email does not match user email'
      });
    }

    // Check for duplicate assignment
    if (user.plan && user.plan.toString() === planId) {
      return res.status(400).json({
        success: false,
        message: 'User is already assigned to this plan'
      });
    }

    // Remove user from ALL other plans' assigned arrays (prevents duplicate assignments)
    const userEmail = user.email;
    await CustomPlan.updateMany(
      { _id: { $ne: planId }, assigned: userEmail },
      { $pull: { assigned: userEmail } }
    );
    await Plan.updateMany(
      { assigned: userEmail },
      { $pull: { assigned: userEmail } }
    );

    // Add email to custom plan's assigned array using $addToSet to prevent duplicates
    await CustomPlan.findByIdAndUpdate(
      planId,
      { 
        $addToSet: { assigned: email },
        updatedAt: new Date()
      },
      { new: true }
    );

    // Apply plan to user
    const updatedUser = await applyPlanToUser(userId, customPlan, 'custom');

    // Update team's purchased plan and maxUsers if user has a team
    const team = await Team.findOne({ owner: userId });
    if (team) {
      team.purchasedPlan = planId;
      team.maxUsers = customPlan.maxUsers || 1;
      await team.save();
    }

    // Create or update subscription for the user
    const now = new Date();
    const billingCycle = mapBillingCycleForSubscription(customPlan.duration || 'yearly');
    const endDate = calculateEndDate(billingCycle, now);

    // Mark existing active subscriptions as expired
    await expireUserSubscriptions(userId);

    // Create new subscription
    const newSubscription = new Subscription({
      user: userId,
      plan: planId,
      planModel: 'CustomPlan',
      startDate: now,
      endDate: endDate,
      status: 'active',
      billingCycle: billingCycle,
    });
    const savedSubscription = await newSubscription.save();

    // Update user's subscription reference and fetch updated user
    await User.findByIdAndUpdate(
      userId,
      { subscription: savedSubscription._id },
      { new: true }
    );

    const populatedUser = await User.findById(userId)
      .populate('plan')
      .populate('subscription')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Custom plan assigned successfully',
      data: {
        user: populatedUser,
        plan: customPlan,
        subscription: savedSubscription
      }
    });

  } catch (error) {
    console.error('Error assigning custom plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while assigning custom plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remove custom plan assignment from user
 * DELETE /api/admin/remove-custom-plan-assignment
 */
const removeCustomPlanAssignment = async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID and email are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.plan || user.planType !== 'custom') {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to a custom plan'
      });
    }

    // Remove email from custom plan's assigned array
    await CustomPlan.findByIdAndUpdate(
      user.plan,
      { 
        $pull: { assigned: email },
        updatedAt: new Date()
      },
      { new: true }
    );

    // Remove plan from user
    const updatedUser = await removePlanFromUser(userId);

    // Clear team's purchased plan
    const team = await Team.findOne({ owner: userId });
    if (team) {
      team.purchasedPlan = null;
      await team.save();
    }

    // Mark user's active subscriptions as expired
    await expireUserSubscriptions(userId);

    // Clear user's subscription reference
    await clearUserSubscriptionRef(userId);

    res.status(200).json({
      success: true,
      message: 'Custom plan assignment removed successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Error removing custom plan assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing custom plan assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get users assigned to specific custom plan
 * GET /api/admin/custom-plan-assignments/:planId
 */
const getCustomPlanAssignments = async (req, res) => {
  try {
    const { planId } = req.params;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    const customPlan = await CustomPlan.findById(planId);
    if (!customPlan) {
      return res.status(404).json({
        success: false,
        message: 'Custom plan not found'
      });
    }

    // Get users assigned to this custom plan
    const assignedEmails = customPlan.assigned || [];
    const users = await User.find({ 
      email: { $in: assignedEmails },
      planType: 'custom'
    }).select('firstName lastName email credits planType createdAt');

    res.status(200).json({
      success: true,
      message: 'Custom plan assignments retrieved successfully',
      data: {
        plan: customPlan,
        users: users,
        totalUsers: users.length,
        assignedEmails: assignedEmails
      }
    });

  } catch (error) {
    console.error('Error fetching custom plan assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching custom plan assignments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  assignCustomPlan,
  removeCustomPlanAssignment,
  getCustomPlanAssignments
};

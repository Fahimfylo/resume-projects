const Plan = require('../models/Plans');
const CustomPlan = require('../models/CustomPlan');
const User = require('../models/User');
const Team = require('../models/Team');
const Subscription = require('../models/Subscription');
const { applyPlanToUser, removePlanFromUser } = require('../services/planService');
const { calculateEndDate, mapBillingCycleForSubscription, expireUserSubscriptions, clearUserSubscriptionRef } = require('../services/subscriptionService');

/**
 * Assign official plan to user
 * POST /api/admin/assign-plan
 */
const assignOfficialPlan = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    // Data validation
    if (!userId || !planId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Plan ID are required'
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

    // Find plan
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan is active
    if (plan.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active plans can be assigned to users'
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
    await Plan.updateMany(
      { _id: { $ne: planId }, assigned: userEmail },
      { $pull: { assigned: userEmail } }
    );
    await CustomPlan.updateMany(
      { assigned: userEmail },
      { $pull: { assigned: userEmail } }
    );

    // Apply plan to user
    const updatedUser = await applyPlanToUser(userId, plan, 'official');

    // Save assigned user email to Plan model
    const assignedUser = await User.findById(userId);
    if (assignedUser) {
      await Plan.findByIdAndUpdate(
        planId,
        { 
          $addToSet: { assigned: assignedUser.email },
          updatedAt: new Date()
        },
        { new: true }
      );
    }

    // Update team's purchased plan and maxUsers if user has a team
    const team = await Team.findOne({ owner: userId });
    if (team) {
      team.purchasedPlan = planId;
      team.maxUsers = plan.maxUsers || 1;
      await team.save();
    }

    // Create or update subscription for the user
    const now = new Date();
    const billingCycle = mapBillingCycleForSubscription(plan.duration || 'yearly');
    const endDate = calculateEndDate(billingCycle, now);

    // Mark existing active subscriptions as expired
    await expireUserSubscriptions(userId);

    // Create new subscription
    const newSubscription = new Subscription({
      user: userId,
      plan: planId,
      planModel: 'Plan',
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
      message: 'Plan assigned successfully',
      data: {
        user: populatedUser,
        plan: plan,
        subscription: savedSubscription
      }
    });

  } catch (error) {
    console.error('Error assigning official plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while assigning plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remove plan from user
 * DELETE /api/admin/remove-plan-assignment
 */
const removePlanAssignment = async (req, res) => {
  try {
    const userId = req.params.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.plan) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to any plan'
      });
    }

    const planId = user.plan;

    // Remove plan from user
    const updatedUser = await removePlanFromUser(userId);

    // Remove user email from Plan model
    if (planId) {
      await Plan.findByIdAndUpdate(
        planId,
        {
          $pull: { assigned: user.email },
          updatedAt: new Date()
        },
        { new: true }
      );
    }

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
      message: 'Plan assignment removed successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Error removing plan assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing plan assignment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get users assigned to specific plan
 * GET /api/admin/plan-assignments/:planId
 */
const getPlanAssignments = async (req, res) => {
  try {
    const { planId } = req.params;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    const users = await User.find({ 
      plan: planId, 
      planType: 'official' 
    }).select('firstName lastName email credits planType createdAt');

    res.status(200).json({
      success: true,
      message: 'Plan assignments retrieved successfully',
      data: {
        plan: plan,
        users: users,
        totalUsers: users.length
      }
    });

  } catch (error) {
    console.error('Error fetching plan assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching assignments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  assignOfficialPlan,
  removePlanAssignment,
  getPlanAssignments
};

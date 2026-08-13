const User = require('../models/User');
const Plan = require('../models/Plans');
const CustomPlan = require('../models/CustomPlan');
const Team = require('../models/Team');

/**
 * Apply plan features to user and synchronize credits
 * @param {string} userId - User ID
 * @param {Object} plan - Plan object (official or custom)
 * @param {string} planType - 'official' or 'custom'
 * @returns {Promise<Object>} Updated user object
 */
const applyPlanToUser = async (userId, plan, planType) => {
  try {
    // Validate inputs
    if (!userId || !plan) {
      throw new Error('User ID and plan are required');
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Extract features from plan
    const features = plan.features || {};
    
    // Bank account model: remaining credits from old plan are added to new plan allocation
    const oldCredits = user.credits || {};
    const creditFields = ['emailCredits', 'phoneCredits', 'verificationCredits', 'exportCredits'];
    const credits = {};
    for (const field of creditFields) {
      const oldField = oldCredits[field] || {};
      const oldCurrent = oldField.current || 0;
      const oldMax = oldField.max || 0;
      const newMax = features[field]?.max || 0;
      credits[field] = {
        current: oldCurrent + newMax,
        max: oldMax + newMax,
      };
    }

    // Copy feature limits from plan to user
    const limits = { ...features.limits };

    // Update user with plan assignment, synchronized credits, and feature limits
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          plan: plan._id,
          planType: planType,
          credits: credits,
          limits: limits,
          updatedAt: new Date()
        },
        $unset: { redeemedDeal: 1 }
      },
      { new: true, runValidators: false }
    );

    // Sync team maxUsers from plan
    const team = await Team.findOne({ owner: userId });
    if (team) {
      team.maxUsers = plan.maxUsers || 1;
      await team.save();
    }

    return updatedUser;
  } catch (error) {
    console.error('Error applying plan to user:', error);
    throw error;
  }
};

/**
 * Remove plan from user and reset credits
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user object
 */
const removePlanFromUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Reset credits to zero and remove plan assignment
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          plan: 1,
          planType: 1
        },
        $set: {
          credits: {
            emailCredits: { current: 0, max: 0 },
            phoneCredits: { current: 0, max: 0 },
            verificationCredits: { current: 0, max: 0 },
            exportCredits: { current: 0, max: 0 }
          },
          limits: {
            csvEnrichment: false,
            technologyFilter: false,
            jobPostingFilter: false,
            revenueFilter: false,
            fundingFilter: false,
            basicIntegrations: false,
            jobChangeFilter: false,
            duplicateControl: false,
            hubspotIntegration: false,
            salesforceIntegration: false,
            jobChangeTracking: false,
          },
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: false }
    );

    return updatedUser;
  } catch (error) {
    console.error('Error removing plan from user:', error);
    throw error;
  }
};

/**
 * Get users assigned to a specific plan
 * @param {string} planId - Plan ID
 * @param {string} planType - 'official' or 'custom'
 * @returns {Promise<Array>} Array of assigned users
 */
const getUsersByPlan = async (planId, planType) => {
  try {
    const users = await User.find({ 
      plan: planId, 
      planType: planType 
    }).select('firstName lastName email credits planType');
    
    return users;
  } catch (error) {
    console.error('Error fetching users by plan:', error);
    throw error;
  }
};

module.exports = {
  applyPlanToUser,
  removePlanFromUser,
  getUsersByPlan
};

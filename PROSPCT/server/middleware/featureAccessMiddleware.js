const User = require("../models/User");
const Plan = require("../models/Plans");
const CustomPlan = require("../models/CustomPlan");

async function resolveLimits(user) {
  let limits = {};
  if (user.limits && Object.values(user.limits).some(Boolean)) {
    limits = user.limits;
  } else if (user.plan) {
    const PlanModel = user.planType === "custom" ? CustomPlan : Plan;
    const plan = await PlanModel.findById(user.plan).select("features.limits");
    limits = plan?.features?.limits || {};
  }
  limits.csvEnrichment = true;
  return limits;
}

const requireFeature = (...featureKeys) => {
  return async (req, res, next) => {
    try {
      const user = req.user
        ? await User.findById(req.user._id || req.user.userId)
            .select("limits plan planType")
        : null;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const limits = await resolveLimits(user);

      const missing = featureKeys.filter((key) => !limits[key]);

      if (missing.length > 0) {
        return res.status(403).json({
          success: false,
          message: `Your plan does not include: ${missing.join(", ")}. Please upgrade your plan to access this feature.`,
          code: "FEATURE_NOT_AVAILABLE",
          missingFeatures: missing,
        });
      }

      next();
    } catch (error) {
      console.error("Feature access check error:", error);
      res.status(500).json({
        success: false,
        message: "Error checking feature access.",
      });
    }
  };
};

module.exports = { requireFeature };

const mongoose = require("mongoose");
const User = require("../models/User");
const Plan = require("../models/Plans");

/**
 * Reset credits to plan-based defaults for each user.
 */
async function resetCredits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({ plan: { $ne: null } }).populate("plan");

    for (const user of users) {
      const features = user.plan?.features || {};
      user.credits = {
        emailCredits: { current: features.emailCredits?.max || 0, max: features.emailCredits?.max || 0 },
        phoneCredits: { current: features.phoneCredits?.max || 0, max: features.phoneCredits?.max || 0 },
        verificationCredits: { current: features.verificationCredits?.max || 0, max: features.verificationCredits?.max || 0 },
        exportCredits: { current: features.exportCredits?.max || 0, max: features.exportCredits?.max || 0 },
      };
      await user.save();
    }

  } catch (error) {
    console.error("Error resetting credits:", error);
  } finally {
    await mongoose.disconnect();
  }
}

resetCredits();

const mongoose = require("mongoose");
const User = require("../models/User");
const Plan = require("../models/Plans");
const CustomPlan = require("../models/CustomPlan");

async function backfillUserLimits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({ plan: { $ne: null } });
    console.log(`Found ${users.length} users with a plan assigned`);

    let updated = 0;
    for (const user of users) {
      const PlanModel = user.planType === "custom" ? CustomPlan : Plan;
      const plan = await PlanModel.findById(user.plan).select("features.limits");
      if (plan?.features?.limits) {
        user.limits = { ...plan.features.limits };
        await user.save();
        updated++;
      }
    }

    console.log(`Updated limits for ${updated} users`);
    console.log("Backfill complete!");
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
}

backfillUserLimits();

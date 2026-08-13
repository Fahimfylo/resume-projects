const Subscription = require("../models/Subscription");
const User = require("../models/User");
const moment = require("moment");

const calculateEndDate = (billingCycle, startDate = new Date()) => {
  const start = moment(startDate);
  if (billingCycle === "monthly") return start.add(1, "month").toDate();
  if (billingCycle === "yearly" || billingCycle === "anually") return start.add(1, "year").toDate();
  if (billingCycle === "lifetime") return start.add(100, "years").toDate();
  return start.add(1, "month").toDate();
};

const mapBillingCycleForSubscription = (duration) => {
  if (duration === "yearly") return "anually";
  return duration;
};

const expireUserSubscriptions = async (userId, exceptSubscriptionId = null) => {
  const filter = { user: userId, status: "active" };
  if (exceptSubscriptionId) {
    filter._id = { $ne: exceptSubscriptionId };
  }
  await Subscription.updateMany(filter, { status: "expired", endDate: new Date() });
};

const clearUserSubscriptionRef = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { subscription: 1 } }, { new: true });
};

async function manageUserSubscription(userId, planId, startDate, billingCycle, options = {}) {
  const { planModel = "Plan" } = options;

  const endDate = calculateEndDate(billingCycle, startDate);

  await expireUserSubscriptions(userId);

  const newSubscription = new Subscription({
    user: userId,
    plan: planId,
    planModel,
    startDate,
    endDate,
    status: "active",
    billingCycle,
  });
  await newSubscription.save();

  return newSubscription;
}

module.exports = {
  calculateEndDate,
  mapBillingCycleForSubscription,
  expireUserSubscriptions,
  clearUserSubscriptionRef,
  manageUserSubscription,
};

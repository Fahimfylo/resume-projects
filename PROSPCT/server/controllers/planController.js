const Plans = require("../models/Plans");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const AddOn = require("../models/AddOn");
const CustomPlan = require("../models/CustomPlan");
const { applyPlanToUser } = require("../services/planService");
const { expireUserSubscriptions, calculateEndDate, mapBillingCycleForSubscription } = require("../services/subscriptionService");

const planControllers = {
  /**
   * --------------------------------
   * GET ALL PLANS (PAGINATED)
   * --------------------------------
   */
  getPlans: async (req, res) => {
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

      const plans = await Plans.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const totalCount = await Plans.countDocuments();

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
        message: "Error fetching plans.",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * GET ACTIVE OFFICIAL PLANS
   * --------------------------------
   */
  getOfficialPlans: async (req, res) => {
    try {
      const plans = await Plans.find({
        type: { $in: ["official", "free"] },
        status: "active",
      }).sort({ createdAt: 1 });

      res.status(200).json({ success: true, plans });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching plans.",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * GET PLAN BY ID (FIXED)
   * --------------------------------
   */
  getPlanById: async (req, res) => {
    try {
      const { id } = req.params;

      const plan = await Plans.findById(id);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Plan not found",
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
   * UPGRADE PLAN / BUY ADDON
   * --------------------------------
   */
  upgradePlan: async (req, res) => {
    try {
      const { isAnnually, additionalCredits, totalAmount, selectedPlan } =
        req.body;

      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (!user)
        return res.status(404).json({
          success: false,
          message: "User not found",
        });

      /**
       * ----------------------------
       * ADDON ONLY (NO PLAN CHANGE)
       * ----------------------------
       */
      if (!selectedPlan && additionalCredits) {
        const addon = await AddOn.create({
          userId,
          type: "emailVerificationCredits",
          quantity: additionalCredits,
          price: totalAmount,
        });

        user.credits.verificationCredits.max += additionalCredits;
        user.credits.verificationCredits.current += additionalCredits;

        await user.save();

        return res.json({
          success: true,
          message: "Additional credits added successfully",
          addon,
          credits: user.credits,
        });
      }

      /**
       * ----------------------------
       * PLAN UPGRADE
       * ----------------------------
       */
      if (selectedPlan) {
        const newPlan = await Plans.findById(selectedPlan._id);
        if (!newPlan)
          return res
            .status(404)
            .json({ success: false, message: "Plan not found" });

        // Expire current subscription
        await Subscription.updateMany(
          { user: userId, status: "active" },
          { status: "expired" },
        );

        const startDate = new Date();
        const endDate = new Date(startDate);

        if (isAnnually) {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        const subscription = await Subscription.create({
          user: userId,
          plan: newPlan._id,
          startDate,
          endDate,
          status: "active",
          billingCycle: isAnnually ? "yearly" : "monthly",
        });

        /**
         * Bank account model: remaining credits from old plan are added to new plan allocation
         */
        const oldCredits = user.credits || {};
        const compute = (field, newMax) => {
          const oldField = oldCredits[field] || {};
          const oldCurrent = oldField.current || 0;
          const oldMax = oldField.max || 0;
          return {
            current: oldCurrent + newMax,
            max: oldMax + newMax,
          };
        };
        user.credits = {
          emailCredits: compute('emailCredits', newPlan.features.emailCredits?.max || 0),
          phoneCredits: compute('phoneCredits', newPlan.features.phoneCredits?.max || 0),
          verificationCredits: (() => {
            const oldField = oldCredits.verificationCredits || {};
            const oldCurrent = oldField.current || 0;
            const newMax = (newPlan.features.verificationCredits?.max || 0) + (additionalCredits || 0);
            return {
              current: oldCurrent + newMax,
              max: oldCurrent + newMax,
            };
          })(),
          exportCredits: compute('exportCredits', newPlan.features.exportCredits?.max || 0),
        };

        user.plan = newPlan._id;
        await user.save();

        return res.json({
          success: true,
          message: "Plan upgraded successfully",
          subscription,
        });
      }

      return res.status(400).json({
        success: false,
        message: "No plan selected or credits purchased",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error upgrading plan",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * INITIALIZE FREE PLAN (DYNAMIC)
   * --------------------------------
   */
  initializeFreePlanSubscription: async (req, res) => {
    try {
      const { userId } = req.user;

      const user = await User.findById(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const freePlan = await Plans.findOne({
        name: "Free",
        status: "active",
      });

      if (!freePlan)
        return res.status(404).json({
          success: false,
          message: "Free plan not configured in database",
        });

      user.credits = {
        emailCredits: {
          max: freePlan.features.emailCredits?.max || 0,
          current: freePlan.features.emailCredits?.max || 0,
        },
        phoneCredits: {
          max: freePlan.features.phoneCredits?.max || 0,
          current: freePlan.features.phoneCredits?.max || 0,
        },
        verificationCredits: {
          max: freePlan.features.verificationCredits?.max || 0,
          current: freePlan.features.verificationCredits?.max || 0,
        },
        exportCredits: {
          max: freePlan.features.exportCredits?.max || 0,
          current: freePlan.features.exportCredits?.max || 0,
        },
      };

      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 100);

      const subscription = await Subscription.create({
        user: userId,
        plan: freePlan._id,
        startDate,
        endDate,
        status: "active",
        billingCycle: "lifetime",
      });

      user.plan = freePlan._id;
      await user.save();

      res.json({
        success: true,
        message: "Free plan activated successfully",
        subscription,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error initializing free plan",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * ADD PLAN
   * --------------------------------
   */
  addPlan: async (req, res) => {
    try {
      const {
        name,
        description,
        pricing,
        features,
        status,
        type,
        recommended,
        duration,
        maxUsers,
        assigned,
      } = req.body;

      if (!name || !pricing || !features) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      if (type === "official") {
        const officialCount = await Plans.countDocuments({
          type: "official",
        });

        if (officialCount >= 4) {
          return res.status(400).json({
            success: false,
            message: "Maximum 4 official plans allowed",
          });
        }
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

      const newPlan = await Plans.create({
        name,
        description,
        pricing: pricingWithFinal,
        features,
        status: status || "active",
        type: type || "official",
        recommended: recommended || false,
        duration,
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

          // Remove from old plan if assigned
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

          // Assign to this plan
          await applyPlanToUser(user._id, newPlan, "official");

          // Create subscription
          await expireUserSubscriptions(user._id);
          const newSubscription = new Subscription({
            user: user._id,
            plan: newPlan._id,
            planModel: 'Plan',
            startDate: now,
            endDate,
            status: 'active',
            billingCycle,
          });
          const savedSubscription = await newSubscription.save();
          await User.findByIdAndUpdate(user._id, { subscription: savedSubscription._id });

          newPlan.assigned.push(email);
        }
        await newPlan.save();
      }

      res.status(201).json({
        success: true,
        message: "Plan added successfully",
        plan: newPlan,
      });
    } catch (error) {
      // Check for duplicate key error
      if (error.code === 11000 || error.message.includes('duplicate key')) {
        const planName = req.body.name || 'This plan';
        return res.status(400).json({
          success: false,
          message: `${planName} plan already exists`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Error adding plan",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * UPDATE PLAN
   * --------------------------------
   */
  updatePlan: async (req, res) => {
    try {
      const { id } = req.params;

      // Get current plan to compare assigned lists
      const currentPlan = await Plans.findById(id);
      if (!currentPlan) {
        return res.status(404).json({ success: false, message: "Plan not found" });
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
        await applyPlanToUser(user._id, planForUser, "official");

        // Create subscription
        await expireUserSubscriptions(user._id);
        const newSubscription = new Subscription({
          user: user._id,
          plan: id,
          planModel: 'Plan',
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

      const updatedPlan = await Plans.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      // Sync credits for assigned users — preserve used credits, update max
      const features = updatedPlan.features || {};
      const creditFields = ['emailCredits', 'phoneCredits', 'verificationCredits', 'exportCredits'];

      if (newAssigned.length > 0) {
        const users = await User.find({ email: { $in: newAssigned } });
        const bulkOps = users.map((u) => {
          const oldCredits = u.credits || {};
          const newCredits = {};
          for (const field of creditFields) {
            const oldField = oldCredits[field] || {};
            const oldCurrent = oldField.current || 0;
            const newMax = features[field]?.max || 0;
            newCredits[field] = {
              current: oldCurrent + newMax,
              max: oldCurrent + newMax,
            };
          }
          return {
            updateOne: {
              filter: { _id: u._id },
              update: {
                $set: {
                  credits: newCredits,
                  updatedAt: new Date(),
                  planType: 'official',
                },
              },
            },
          };
        });

        if (bulkOps.length > 0) {
          await User.bulkWrite(bulkOps);
        }
      }

      res.json({
        success: true,
        message: "Plan updated successfully",
        plan: updatedPlan,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating plan",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * SEARCH PLANS
   * --------------------------------
   */
  searchPlans: async (req, res) => {
    try {
      const plans = await Plans.find(req.query);

      if (!plans.length)
        return res.status(404).json({
          success: false,
          message: "No plans found",
        });

      res.json({ success: true, data: plans });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error searching plans",
        error: error.message,
      });
    }
  },

  /**
   * --------------------------------
   * DELETE PLAN
   * --------------------------------
   */
  deletePlan: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedPlan = await Plans.findByIdAndDelete(id);
      if (!deletedPlan)
        return res
          .status(404)
          .json({ success: false, message: "Plan not found" });

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
        message: "Plan deleted successfully",
        plan: deletedPlan,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting plan",
        error: error.message,
      });
    }
  },
};

module.exports = planControllers;

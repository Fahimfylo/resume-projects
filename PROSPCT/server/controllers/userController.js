const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Plan = require("../models/Plans");
const CustomPlan = require("../models/CustomPlan");
const Subscription = require("../models/Subscription");
const axios = require("axios");
const logger = require("../utils/logger");
const { applyPlanToUser } = require("../services/planService");
const { expireUserSubscriptions, calculateEndDate, mapBillingCycleForSubscription } = require("../services/subscriptionService");

const userController = {
  getAllUsers: async (req, res) => {
    try {
      let { page = 1, limit = 10 } = req.query;
      page = parseInt(page, 10);
      limit = parseInt(limit, 10);

      if (isNaN(page) || page <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid page number" });
      }

      if (isNaN(limit) || limit <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid limit value" });
      }

      const skip = (page - 1) * limit;
      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("plan")
        .populate("subscription")
        .exec();
      const totalCount = await User.countDocuments();

      return res.status(200).json({
        success: true,
        users,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      });
    } catch (error) {
      console.error("Error fetching users", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  },

  getUserBySearch: async (req, res) => {
    try {
      // Extract search query, page, and limit from request query params
      const { searchQuery = "", page = 1, limit = 10 } = req.query;

      // Ensure valid pagination values
      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;
      if (pageNumber <= 0 || limitNumber <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid pagination values." });
      }

      // Sanitize input to prevent Regex-based NoSQL injection
      const escapeRegex = (string) =>
        string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const sanitizedQuery = escapeRegex(searchQuery);

      // Define the search condition with case-insensitive regex for multiple fields
      const searchConditions = {
        $or: [
          { email: { $regex: sanitizedQuery, $options: "i" } },
          { firstName: { $regex: sanitizedQuery, $options: "i" } },
          { lastName: { $regex: sanitizedQuery, $options: "i" } },
          { countryCode: { $regex: sanitizedQuery, $options: "i" } },
        ],
      };

      // Perform the query with pagination
      const skip = (pageNumber - 1) * limitNumber;
      const users = await User.find(searchConditions)
        .select("-password") // Exclude sensitive fields like password
        .skip(skip)
        .limit(limitNumber)
        .populate("plan") // Populate referenced fields
        .populate("subscription")
        .exec();

      // Count total documents matching the search conditions
      const totalCount = await User.countDocuments(searchConditions);

      // Handle no matching users
      if (users.length === 0) {
        return res
          .status(404)
          .json({
            success: false,
            message: "No users found matching your search.",
          });
      }

      // Return paginated and filtered users
      return res.status(200).json({
        success: true,
        users,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
        currentPage: pageNumber,
      });
    } catch (error) {
      logger.error(
        `Error searching users: ${error.message} at ${new Date().toISOString()}`,
      );
      return res.status(500).json({
        success: false,
        message: "An error occurred while searching for users.",
        error: error.message,
      });
    }
  },

  addUser: async (req, res) => {
    const {
      email,
      password,
      firstName,
      lastName,
      countryCode,
      mobile,
      company,
      googleId,
      telegramId,
      linkedInId,
      profilePicture,
      credits,
      selectedPlan,
      selectedStatus = "active",
      selectedBillingCycle = "monthly",
      role = "user",
    } = req.body;

    try {
      // Check for existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use." });
      }

      // Validate role
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role specified." });
      }

      // Validate and auto-format countryCode
      let formattedCountryCode = (countryCode || "").trim();
      if (formattedCountryCode) {
        if (!formattedCountryCode.startsWith("+")) formattedCountryCode = "+" + formattedCountryCode;
        if (!/^\+\d{1,3}$/.test(formattedCountryCode)) {
          return res.status(400).json({ 
            message: "Invalid country code format. Please use format like +1, +880, etc." 
          });
        }
      }

      // Hash password if provided
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

      // Fetch the plan
      const plan = await Plan.findOne({ name: selectedPlan });
      if (!plan) {
        return res.status(400).json({ message: "Invalid plan selected." });
      }

      // Set dynamic credits based on the selected plan
      const userCredits = credits || {
        emailCredits: {
          current: plan.features?.emailCredits?.max || 0,
          max: plan.features?.emailCredits?.max || 0,
        },
        phoneCredits: {
          current: plan.features?.phoneCredits?.max || 0,
          max: plan.features?.phoneCredits?.max || 0,
        },
        verificationCredits: {
          current: plan.features?.verificationCredits?.max || 0,
          max: plan.features?.verificationCredits?.max || 0,
        },
        exportCredits: {
          current: plan.features?.exportCredits?.max || 0,
          max: plan.features?.exportCredits?.max || 0,
        },
      };

      // Create user
      const newUser = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        countryCode: formattedCountryCode || "+1",
        phone: mobile || "",
        company,
        googleId,
        telegramId,
        linkedInId,
        profilePicture,
        credits: userCredits,
        plan: plan._id,
        role,
      });

      const savedUser = await newUser.save();

      // Create a free subscription for the user
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime subscription

      const newSubscription = new Subscription({
        user: savedUser._id,
        plan: plan._id,
        planModel: 'Plan',
        startDate,
        endDate,
        status: selectedStatus,
        billingCycle: selectedBillingCycle,
      });

      // Save the new subscription
      const savedSubscription = await newSubscription.save();

      // Update the user with the subscription _id
      savedUser.subscription = savedSubscription._id;
      await savedUser.save();

      res
        .status(201)
        .json({
          success: true,
          message: "User created successfully.",
          user: newUser,
        });
    } catch (error) {
      console.error("Error creating user:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Error creating user.",
          error: error.message,
        });
    }
  },

  getCurrentUser: async (req, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const user = await User.findById(userId)
        .select("-password")
        .populate("plan");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      return res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("Error fetching current user:", error);
      return res
        .status(500)
        .json({
          success: false,
          message: "Error fetching current user",
          error: error.message,
        });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId)
        .select("-password")
        .populate("plan")
        .populate("subscription");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching user",
        error: error.message,
      });
    }
  },

  updateUser: async (req, res) => {
    const userId = req.params.userId;

    // Security: IDOR & Privilege Escalation protection
    const authUser = req.admin || req.user;
    if (authUser.role?.toLowerCase() !== "admin" && String(authUser._id) !== String(userId)) {
      logger.error(
        `IDOR attempt: User ${authUser._id} tried to update profile of ${userId} at ${new Date().toISOString()}`,
      );
      return res
        .status(403)
        .json({
          message: "Forbidden: You are not authorized to update this profile",
        });
    }

    const {
      firstName, lastName, bio, countryCode, phone, email, alternativeEmails,
      selectedPlan, credits, role, password, isBlocked, company,
    } = req.body;

    try {
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Handle plan change (only if plan actually changed)
      let planWasApplied = false;
      const newEmail = email !== undefined ? email : user.email;
      if (selectedPlan !== undefined) {
        const currentPlanName = user.plan
          ? (await Plan.findById(user.plan, { name: 1, _id: 0 }))?.name
          : "";
        if (selectedPlan !== currentPlanName) {
          if (selectedPlan && selectedPlan !== "custom") {
            const planObj = await Plan.findOne({ name: selectedPlan });
            if (planObj) {
              // Remove from old plan's assigned array
              if (user.plan) {
                await Plan.findByIdAndUpdate(user.plan, {
                  $pull: { assigned: user.email },
                  updatedAt: new Date(),
                });
                await CustomPlan.findByIdAndUpdate(user.plan, {
                  $pull: { assigned: user.email },
                  updatedAt: new Date(),
                });
              }
              // Apply new plan (updates user.plan, planType, credits)
              await applyPlanToUser(userId, planObj, "official");
              planWasApplied = true;
              // Add to new plan's assigned array (use new email if changing)
              await Plan.findByIdAndUpdate(planObj._id, {
                $addToSet: { assigned: newEmail },
                updatedAt: new Date(),
              });
              // Create subscription for the user
              const now = new Date();
              const billingCycle = mapBillingCycleForSubscription(planObj.duration || 'yearly');
              const endDate = calculateEndDate(billingCycle, now);
              await expireUserSubscriptions(userId);
              const newSubscription = new Subscription({
                user: userId,
                plan: planObj._id,
                planModel: 'Plan',
                startDate: now,
                endDate,
                status: 'active',
                billingCycle,
              });
              const savedSubscription = await newSubscription.save();
              await User.findByIdAndUpdate(userId, { subscription: savedSubscription._id });
            }
          } else {
            // "custom" or empty — remove plan assignment
            if (user.plan) {
              await Plan.findByIdAndUpdate(user.plan, {
                $pull: { assigned: user.email },
                updatedAt: new Date(),
              });
              await CustomPlan.findByIdAndUpdate(user.plan, {
                $pull: { assigned: user.email },
                updatedAt: new Date(),
              });
            }
            await User.findByIdAndUpdate(userId, {
              $unset: { plan: 1, planType: 1, subscription: 1, redeemedDeal: 1 },
            });
            await expireUserSubscriptions(userId);
          }
        }
      }

      // Build update data for remaining fields
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (bio !== undefined) updateData.bio = bio;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (alternativeEmails !== undefined) {
        if (!Array.isArray(alternativeEmails)) {
          return res.status(400).json({ message: "alternativeEmails must be an array" });
        }
        if (alternativeEmails.length > 3) {
          return res.status(400).json({ message: "Maximum 3 alternative emails allowed" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalid = alternativeEmails.filter((e) => !emailRegex.test(e));
        if (invalid.length > 0) {
          return res.status(400).json({ message: "Invalid email format in alternativeEmails" });
        }
        updateData.alternativeEmails = alternativeEmails;
      }
      if (countryCode !== undefined) {
        let cc = (countryCode || "").trim();
        if (cc) {
          if (!cc.startsWith("+")) cc = "+" + cc;
          if (!/^\+\d{1,3}$/.test(cc)) {
            return res.status(400).json({
              message: "Invalid country code format. Please use format like +1, +880, etc.",
            });
          }
        }
        updateData.countryCode = cc;
      }
      if (!planWasApplied && credits !== undefined) {
        updateData.credits = {
          emailCredits: {
            current: credits.emailCredits?.current ?? 0,
            max: credits.emailCredits?.max ?? 0,
          },
          phoneCredits: {
            current: credits.phoneCredits?.current ?? 0,
            max: credits.phoneCredits?.max ?? 0,
          },
          verificationCredits: {
            current: credits.verificationCredits?.current ?? 0,
            max: credits.verificationCredits?.max ?? 0,
          },
          exportCredits: {
            current: credits.exportCredits?.current ?? 0,
            max: credits.exportCredits?.max ?? 0,
          },
        };
      }
      if (role !== undefined) updateData.role = role;
      if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
      if (company !== undefined) updateData.company = company;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      // Only run update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        await User.findByIdAndUpdate(
          userId,
          { $set: updateData },
          { new: true, runValidators: false },
        );
      }

      // Fetch final user state
      const updatedUser = await User.findById(userId)
        .populate("plan")
        .populate("subscription")
        .select("-password -__v");

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      logger.error(
        `Error updating user ${userId}: ${error.message} at ${new Date().toISOString()}`,
      );
      res.status(500).json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  },

  // Upload profile picture and update the user's profilePicture field
  uploadProfilePicture: async (req, res) => {
    try {
      const authUser = req.admin || req.user;
      const userId = req.params.userId || authUser._id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Save only the relative path — client constructs the absolute URL per environment
      const profilePictureUrl = `/uploads/images/${file.filename}`;

      // Atomic update
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { profilePicture: profilePictureUrl } },
        { new: true },
      ).select("-password -__v");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      logger.info(
        `Profile picture updated for user ${userId} at ${new Date().toISOString()}`,
      );

      res
        .status(200)
        .json({ success: true, message: "Profile picture updated", user });
    } catch (error) {
      logger.error(
        `Error uploading profile picture for ${authUser._id}: ${error.message} at ${new Date().toISOString()}`,
      );
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to upload profile picture",
          error: error.message,
        });
    }
  },

  deleteUser: async (req, res) => {
    const { userId } = req.params;

    try {
      // Find and delete the user
      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
        user: deletedUser,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting user",
        error: error.message,
      });
    }
  },
  deleteAllUsers: async (req, res) => {
    try {
      // Delete all users in the collection
      await User.deleteMany({});

      res.status(200).json({
        success: true,
        message: "All users deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting all users:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting all users",
        error: error.message,
      });
    }
  },
  toggleIsBlocked: async (req, res) => {
    const { userId } = req.params;
    const { isBlocked } = req.body; // Optional: Can be set to true or false

    try {
      // Find user by ID
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Toggle `isBlocked` status or set it explicitly if provided
      user.isBlocked =
        typeof isBlocked !== "undefined" ? isBlocked : !user.isBlocked;
      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        message: "User isBlocked status updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating isBlocked status:", error);
      res.status(500).json({
        success: false,
        message: "Error updating isBlocked status",
        error: error.message,
      });
    }
  },

  updateUserWithField: async (req, res) => {
    const { userId, updates } = req.body;

    try {
      const updatedUser = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Count total users
  countTotalUsers: async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();

      res.status(200).json({
        success: true,
        message: "Total users counted successfully.",
        totalUsers,
      });
    } catch (error) {
      console.error("Error counting total users:", error);
      res.status(500).json({
        success: false,
        message: "Error counting total users.",
        error: error.message,
      });
    }
  },
};

module.exports = userController;

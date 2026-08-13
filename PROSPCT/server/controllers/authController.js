const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Team = require("../models/Team");
const Plan = require("../models/Plans");
const Subscription = require("../models/Subscription");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const { sendOtpEmail } = require("../utils/emailService");
const { extractInviteId } = require("../utils/inviteToken");
const { resolveUserPermissions } = require("../services/permissionService");

/* ================================
   ✅ ENV CONFIG (NEW — IMPORTANT)
================================ */

const SERVER_URL = process.env.BACKEND_URL || process.env.SERVER_URL || "http://localhost:4000";
const CLIENT_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authController = {
  registration: async (req, res) => {
    try {
      const {
        email,
        alternativeEmail,
        company,
        firstName,
        lastName,
        countryCode,
        phone,
        password,
        inviteToken,          // Standard name
        relationToken,        // Alternative name from invite link
      } = req.body;

      // Use either inviteToken or relationToken (for invite link compatibility)
      const token = inviteToken || relationToken;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // NO domain restriction for business emails - any valid email is accepted.

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash the password BEFORE processing invite (needed for both flows)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // --- Handle invite token (relationToken) if provided ---
      let invitedBy = null;
      let targetTeamId = null;
      let isTeamInvite = false;


      if (token) {
        let inviteEmail;
        try {
          inviteEmail = extractInviteId(token);
        } catch (decryptErr) {
        }

        if (inviteEmail) {
          const team = await Team.findOne({
            "members.email": inviteEmail.toLowerCase(),
            "members.status": "pending",
          }).populate("owner", "_id firstName lastName email");


          if (team) {
            const member = team.members.find(
              (m) => m.email === inviteEmail.toLowerCase() && m.status === "pending",
            );


            if (member && member.email.toLowerCase() === email.toLowerCase()) {
              invitedBy = team.owner._id;
              targetTeamId = team._id;
              isTeamInvite = true;
            } else {
            }
          }
        }
      } else {
      }

      // Team invite registration - create User with team context
      if (isTeamInvite) {
        const team = await Team.findById(targetTeamId);
        if (!team) {
          return res.status(400).json({ message: "Invalid invite - team not found" });
        }

        // Check if user already exists with this email
        const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserByEmail) {
          return res.status(400).json({ message: "This email is already registered" });
        }

        // Fetch the Free plan for the new team member
        const freePlan = await Plan.findOne({ name: "Free", status: "active" });

        if (!freePlan) {
          return res.status(400).json({
            message: "Free plan is not configured. Please contact support."
          });
        }

        // Create User with team context (not Member)
        // Note: teamRole is NOT stored here - single source of truth is Team.members
        const newUser = new User({
          email: email.toLowerCase(),
          alternativeEmails: alternativeEmail ? [alternativeEmail.toLowerCase()] : [],
          company,
          firstName,
          lastName,
        countryCode: formattedCountryCode || "+1",
          phone: phone || "",
          password: hashedPassword,
          role: "user", // Global role stays "user"
          // teamRole comes from Team.members - NOT stored on User
          invitedBy: invitedBy,
          teamId: targetTeamId,
          isVerified: true, // Team invitees skip OTP verification
          credits: {
            emailCredits: { current: freePlan.features.emailCredits?.max || 0, max: freePlan.features.emailCredits?.max || 0 },
            phoneCredits: { current: freePlan.features.phoneCredits?.max || 0, max: freePlan.features.phoneCredits?.max || 0 },
            verificationCredits: { current: freePlan.features.verificationCredits?.max || 0, max: freePlan.features.verificationCredits?.max || 0 },
            exportCredits: { current: freePlan.features.exportCredits?.max || 0, max: freePlan.features.exportCredits?.max || 0 },
          },
          plan: freePlan._id,
          subscription: null,
        });

        const savedUser = await newUser.save();

        // Add user email to plan's assigned list
        await Plan.findByIdAndUpdate(freePlan._id, { $addToSet: { assigned: email.toLowerCase() } });

        // Update team member status to joined (link to User and copy name)
        team.markMemberJoined(email.toLowerCase(), savedUser._id, firstName, lastName);
        await team.save();

        // Issue minimal JWT - contains ONLY userId
        // All role/team data is resolved from DB on each request via authMiddleware
        const jwtToken = jwt.sign(
          { userId: savedUser._id },
          process.env.JWT_SECRET,
          { expiresIn: "7d" },
        );

        savedUser.token = jwtToken;
        await savedUser.save();

        return res.status(201).json({
          message: "Account created successfully. You've been added to the team.",
          needsVerification: false,
          accessToken: jwtToken,
          user: {
            _id: savedUser._id,
            email: savedUser.email,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            role: "user",
            teamRole: "member", // From Team.members (where user was just added)
            teamId: targetTeamId,
            ownerId: invitedBy,
          }
        });
      }

      // Regular registration - create User with OTP verification
      const freePlan = await Plan.findOne({ name: "Free", status: "active" });

      if (!freePlan) {
        return res.status(400).json({
          message: "Free plan is not configured. Please contact support."
        });
      }

      // Regular registrations require SMTP OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

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


      // Create a new user
      const newUser = new User({
        email,
        alternativeEmails: alternativeEmail ? [alternativeEmail.toLowerCase()] : [],
        company,
        firstName,
        lastName,
        countryCode: countryCode || "+1",
        phone: phone || "",
        password: hashedPassword,
        isVerified: false,
        verificationOTP: otp,
        otpExpires,
        invitedBy,
        credits: {
          emailCredits: {
            current: freePlan.features.emailCredits?.max || 0,
            max: freePlan.features.emailCredits?.max || 0,
          },
          phoneCredits: {
            current: freePlan.features.phoneCredits?.max || 0,
            max: freePlan.features.phoneCredits?.max || 0,
          },
          verificationCredits: {
            current: freePlan.features.verificationCredits?.max || 0,
            max: freePlan.features.verificationCredits?.max || 0,
          },
          exportCredits: {
            current: freePlan.features.exportCredits?.max || 0,
            max: freePlan.features.exportCredits?.max || 0,
          },
        },
        plan: freePlan._id,
        subscription: null,
      });

      // Save the new user
      const savedUser = await newUser.save();

      // Add user email to plan's assigned list
      await Plan.findByIdAndUpdate(freePlan._id, { $addToSet: { assigned: email.toLowerCase() } });

      // Create a free subscription for the user
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime subscription

      const newSubscription = new Subscription({
        user: savedUser._id,
        plan: freePlan._id,
        planModel: 'Plan',
        startDate,
        endDate,
        status: "active",
        billingCycle: "lifetime",
      });

      // Save the new subscription
      const savedSubscription = await newSubscription.save();

      // Update the user with the subscription _id
      savedUser.subscription = savedSubscription._id;
      await savedUser.save();

      // Send OTP verification email
      try {
        await sendOtpEmail(email, otp, savedUser.firstName);
      } catch (mailErr) {
        console.error("Failed to send OTP email:", mailErr.message);
      }

      // Issue a TEMPORARY, restricted JWT for verification
      const tempToken = jwt.sign(
        { userId: savedUser._id, needsVerification: true },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.status(201).json({
        message: "Account created. Please verify your email.",
        needsVerification: true,
        tempToken,
        user: {
          id: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  verifyRegistrationOtp: async (req, res) => {
    try {
      const { otp } = req.body;
      const authHeader = req.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const tempToken = authHeader.split(" ")[1];
      let decoded;

      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      if (!decoded.needsVerification) {
        return res.status(403).json({ message: "Token is not a verification token" });
      }

      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }

      if (!user.verificationOTP || user.verificationOTP !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (!user.otpExpires || user.otpExpires < new Date()) {
        return res.status(400).json({ message: "OTP has expired. Please register again." });
      }

      // Mark verified
      user.isVerified = true;
      user.verificationOTP = null;
      user.otpExpires = null;

      // Issue actual JWT
      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      user.token = jwtToken;
      await user.save();

      // Populate plan and subscription data
      await user.populate("plan");
      await user.populate("subscription");

      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      res.status(200).json({
        message: "Registration verified successfully!",
        accessToken: jwtToken,
        user: {
          _id: user._id,
          username: fullName || user.email,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          plan: user.plan,
          subscription: user.subscription,
          credits: user.credits,
          profilePicture: user.profilePicture,
          company: user.company,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong during verification" });
    }
  },

  // Resend OTP for unverified user (used from verify-email page)
  resendOtp: async (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const tempToken = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      if (!decoded.needsVerification) {
        return res.status(403).json({ message: "Token is not a verification token" });
      }

      // Handle Google registration (user not in DB yet)
      if (decoded.isGoogleRegistration && decoded.pendingUserData) {
        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Update the pending user data in a new token
        const newTempToken = jwt.sign(
          {
            needsVerification: true,
            isGoogleRegistration: true,
            pendingUserData: {
              ...decoded.pendingUserData,
              otp,
              otpExpires: otpExpires.toISOString(),
            },
          },
          process.env.JWT_SECRET,
          { expiresIn: "15m" },
        );

        // Send OTP email
        try {
          await sendOtpEmail(
            decoded.pendingUserData.email,
            otp,
            decoded.pendingUserData.firstName
          );
        } catch (mailErr) {
          console.error("Failed to resend OTP email:", mailErr.message);
          return res.status(500).json({ message: "Failed to send OTP email" });
        }

        return res.status(200).json({
          message: "OTP sent successfully",
          tempToken: newTempToken,
        });
      }

      // Handle regular user (already in DB)
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
      user.verificationOTP = otp;
      user.otpExpires = otpExpires;
      await user.save();

      sendOtpEmail(user.email, otp, user.firstName).catch(() => {});

      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Find user in User collection
      const existingUser = await User.findOne({ email: normalizedEmail })
        .select("+password"); // Ensure password is included for comparison

      if (!existingUser) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if the user is blocked
      if (existingUser.isBlocked) {
        return res.status(403).json({
          message: "Your account is blocked. Please contact support.",
        });
      }

      // Check if the user has verified their email
      if (!existingUser.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
        existingUser.verificationOTP = otp;
        existingUser.otpExpires = otpExpires;
        await existingUser.save();

        sendOtpEmail(existingUser.email, otp, existingUser.firstName).catch(() => {});

        const tempToken = jwt.sign(
          { userId: existingUser._id, needsVerification: true },
          process.env.JWT_SECRET,
          { expiresIn: "15m" },
        );

        return res.status(200).json({
          message: "Please verify your email to continue. We've sent a new OTP to your inbox.",
          needsVerification: true,
          tempToken,
          user: {
            _id: existingUser._id,
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
          },
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, existingUser.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // If user has a team association, verify membership is still valid
      if (existingUser.teamId) {
        const team = await Team.findById(existingUser.teamId).select("_id owner members");

        if (!team) {
          // Team was deleted but user still references it - treat as standalone user
          await User.findByIdAndUpdate(existingUser._id, {
            $unset: { teamId: "", invitedBy: "" }
          });
          existingUser.teamId = null;
          existingUser.invitedBy = null;
        } else {
          // Verify user is still a member of this team
          const membership = team.members.find(
            (m) => m.user && m.user.toString() === existingUser._id.toString()
          );

          if (!membership || membership.status !== "joined") {
            // User was removed from team - BLOCK login (no auto-revert)
            return res.status(403).json({
              message: "Access revoked. Your team membership is no longer active.",
            });
          }
        }
      }

      // Issue minimal JWT - contains ONLY userId
      // All role/team/workspace data is resolved from DB on each request
      const token = jwt.sign(
        { userId: existingUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "30d" },
      );

      // Update user token
      existingUser.token = token;
      await existingUser.save();

      // Populate plan and subscription data
      try { await existingUser.populate('plan'); } catch (e) { console.error('Failed to populate plan:', e); }
      try { await existingUser.populate('subscription'); } catch (e) { console.error('Failed to populate subscription:', e); }

      // Resolve fresh permissions (including teamRole from Team.members)
      let permissions = { teamRole: null };
      try { permissions = await resolveUserPermissions(existingUser._id, existingUser.teamId); } catch (e) { console.error('Failed to resolve permissions:', e); }

      const fullName = `${existingUser.firstName || ""} ${existingUser.lastName || ""}`.trim();
      const userData = {
        _id: existingUser._id,
        username: fullName || existingUser.email,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        role: existingUser.role,
        teamRole: permissions.teamRole, // Use resolved role
        plan: existingUser.plan,
        subscription: existingUser.subscription,
        credits: existingUser.credits,
        profilePicture: existingUser.profilePicture,
        company: existingUser.company,
      };

      // Include team context if applicable
      if (existingUser.teamId) {
        userData.teamId = existingUser.teamId;
        userData.ownerId = existingUser.invitedBy;
      }

      res.status(200).json({
        message: "Login successful",
        accessToken: token,
        user: userData,
      });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const existingAdmin = await Admin.findOne({ email });

      if (!existingAdmin) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check password properly
      const isMatch = await bcrypt.compare(password, existingAdmin.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: existingAdmin._id, role: existingAdmin.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" },
      );

      // Save token to admin
      existingAdmin.token = token;
      await existingAdmin.save();

      res.status(200).json({
        success: true,
        message: "Login successful",
        adminAccessToken: token,
        admin: {
          id: existingAdmin._id,
          firstName: existingAdmin.firstName,
          lastName: existingAdmin.lastName,
          email: existingAdmin.email,
          role: existingAdmin.role,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ success: false, message: "Something went wrong" });
    }
  },

  verifyToken: async (req, res) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ensure this is a USER token, not an admin token
      if (decoded.role === "admin") {
        return res.status(403).json({ message: "Invalid token: User role required. Please use user login" });
      }

      const userId = decoded.userId;
      if (!userId) {
        return res.status(401).json({ message: "Invalid token payload" });
      }

      const user = await User.findById(userId)
        .select("-password")
        .populate("plan", "name");

      if (!user) return res.status(401).json({ message: "User not found" });

      // Block unverified users
      if (!user.isVerified) {
        return res.status(403).json({
          message: "Email not verified. Please verify your email to continue.",
          needsVerification: true,
        });
      }

      // If user has a team, verify membership is still valid
      if (user.teamId) {
        const team = await Team.findById(user.teamId).select("_id owner members");
        if (!team) {
          // Team was deleted - treat user as standalone
          // Clear team reference so they can log in as regular user
          await User.findByIdAndUpdate(user._id, {
            $unset: { teamId: "", invitedBy: "" }
          });
          user.teamId = null;
          user.invitedBy = null;
        } else {
          const membership = team.members.find(
            (m) => m.user && m.user.toString() === user._id.toString()
          );
          if (!membership || membership.status !== "joined") {
            // Membership revoked - clear team reference
            await User.findByIdAndUpdate(user._id, {
              $unset: { teamId: "", invitedBy: "" }
            });
            user.teamId = null;
            user.invitedBy = null;
          }
        }
      }

      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decoded.exp - now;
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

      const userData = {
        ...user.toObject(),
        username: fullName || user.email,
      };

      // Include team context from DB
      if (user.teamId) {
        // Resolve fresh permissions (including teamRole from Team.members)
      let permissions = { teamRole: null };
      try { permissions = await resolveUserPermissions(user._id, user.teamId); } catch (e) { console.error('Failed to resolve permissions:', e); }
        
        userData.teamId = user.teamId;
        userData.ownerId = user.invitedBy;
        userData.teamRole = permissions.teamRole; // Use resolved role
      }

      // Refresh token if near expiration - always minimal payload
      if (timeLeft < 24 * 60 * 60) {
        const newToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: "30d" }
        );
        user.token = newToken;
        await user.save();
        return res.status(200).json({ user: userData, accessToken: newToken });
      }

      res.status(200).json({ user: userData });
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  },

  verifyAdminToken: async (req, res) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ CRITICAL FIX: Ensure this is an ADMIN token, not a user token
      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Invalid token: Admin role required" });
      }

      const admin = await Admin.findById(decoded.userId).select("-password");

      if (!admin) return res.status(401).json({ message: "Admin not found" });

      // NOTE: We intentionally do not enforce a server-side "single active token" policy here.
      //       That would cause existing admin sessions to be invalidated when a new login occurs.
      //       JWT validation is sufficient for auth in our current flow.

      // refresh admin token if near expiration
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decoded.exp - now;
      if (timeLeft < 24 * 60 * 60) {
        const newToken = jwt.sign(
          { userId: admin._id, role: admin.role },
          process.env.JWT_SECRET,
          { expiresIn: "30d" }
        );
        admin.token = newToken;
        await admin.save();
        return res.status(200).json({ admin, adminAccessToken: newToken });
      }

      res.status(200).json({ admin });
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  },

  logout: async (req, res) => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "No token provided" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === "admin") {
        return res.status(403).json({ message: "Use admin logout endpoint for admin accounts" });
      }

      await User.findByIdAndUpdate(decoded.userId, { token: null });

      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  adminLogout: async (req, res) => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "No token provided" });
      
      // Decode the token to get admin id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // ✅ CRITICAL FIX: Only allow admin tokens to logout as admins
      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Use regular logout endpoint for user accounts" });
      }
      
      await Admin.findByIdAndUpdate(decoded.userId, { token: null });

      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  googleAuth: async (req, res) => {
    try {
      const { token } = req.body;
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const { email, name, picture } = ticket.getPayload();

      let user = await User.findOne({ email });
      const isRegistration = req.body.isRegistration;

      if (!user) {
        if (!isRegistration) {
          // Login attempt - reject unregistered users
          return res.status(404).json({
            message: "User not found. Please register first.",
          });
        }
        
        // Registration - create new user account
        const freePlan = await Plan.findOne({ name: "Free", status: "active" });

        if (!freePlan) {
          return res.status(400).json({
            message: "Free plan is not configured. Please contact support."
          });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // expires in 10 minutes

        // Send OTP email first (non-blocking — don't let email failure break auth)
        try {
          await sendOtpEmail(email, otp, name.split(" ")[0]);
        } catch (mailErr) {
          console.error("Failed to send OTP email:", mailErr.message);
          return res.status(500).json({
            message: "Failed to send verification email. Please try again.",
          });
        }

        // Store user data in tempToken (encrypted in JWT) - DON'T create user in DB yet
        const tempToken = jwt.sign(
          {
            needsVerification: true,
            isGoogleRegistration: true,
            pendingUserData: {
              email,
              firstName: name.split(" ")[0],
              lastName: name.split(" ").slice(1).join(" "),
              profilePicture: picture,
              googleId: ticket.getUserId(),
              otp,
              otpExpires: otpExpires.toISOString(),
            },
          },
          process.env.JWT_SECRET,
          { expiresIn: "15m" },
        );

        return res.status(200).json({
          message: "Account created. Please verify your email.",
          needsVerification: true,
          tempToken,
          user: {
            email,
            firstName: name.split(" ")[0],
            lastName: name.split(" ").slice(1).join(" "),
          },
        });
      }

      // --- Returning user path ---
      // User exists - if from registration page, just log them in directly
      if (isRegistration) {
        if (!user.googleId) {
          user.googleId = ticket.getUserId();
          await user.save();
        }

        // If user is not verified, resend OTP
        if (!user.isVerified) {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
          user.verificationOTP = otp;
          user.otpExpires = otpExpires;
          await user.save();

          try {
            await sendOtpEmail(email, otp, user.firstName);
          } catch (mailErr) {
            console.error("Failed to send OTP email:", mailErr.message);
          }

          const tempToken = jwt.sign(
            { userId: user._id, needsVerification: true },
            process.env.JWT_SECRET,
            { expiresIn: "15m" },
          );

          return res.status(200).json({
            message: "Please verify your email to continue.",
            needsVerification: true,
            tempToken,
            user: {
              id: user._id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            },
          });
        }

        // Verified user - issue full token
        const jwtToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: "7d" },
        );

        user.token = jwtToken;
        await user.save();
        await user.populate("plan");
        await user.populate("subscription");

        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        return res.status(200).json({
          message: "Google authentication successful",
          accessToken: jwtToken,
          user: {
            _id: user._id,
            username: fullName || user.email,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            plan: user.plan,
            subscription: user.subscription,
            credits: user.credits,
            profilePicture: user.profilePicture,
            company: user.company,
          },
        });
      }

      // Login attempt for existing user
      if (!user.googleId) {
        user.googleId = ticket.getUserId();
        await user.save();
      }

      // If returning user is somehow not verified, resend OTP instead of logging in
      if (!user.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.verificationOTP = otp;
        user.otpExpires = otpExpires;
        await user.save();

        try {
          await sendOtpEmail(email, otp, user.firstName);
        } catch (mailErr) {
          console.error("Failed to send OTP email:", mailErr.message);
        }

        const tempToken = jwt.sign(
          { userId: user._id, needsVerification: true },
          process.env.JWT_SECRET,
          { expiresIn: "15m" },
        );

        return res.status(200).json({
          message: "Please verify your email to continue.",
          needsVerification: true,
          tempToken,
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        });
      }

      // Fully verified — issue a full-access JWT
      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      user.token = jwtToken;
      await user.save();

      // Populate plan and subscription data
      await user.populate("plan");
      await user.populate("subscription");

      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      res.status(200).json({
        message: "Google authentication successful",
        accessToken: jwtToken,
        user: {
          _id: user._id,
          username: fullName || user.email,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          plan: user.plan,
          subscription: user.subscription,
          credits: user.credits,
          profilePicture: user.profilePicture,
          company: user.company,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Something went wrong during Google authentication" });
    }
  },

  verifyOtp: async (req, res) => {
    try {
      const { otp } = req.body;
      const authHeader = req.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const tempToken = authHeader.split(" ")[1];
      let decoded;

      try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // Ensure this is a temp verification token
      if (!decoded.needsVerification) {
        return res.status(403).json({ message: "Token is not a verification token" });
      }

      // Check if this is a Google registration (user not yet in DB)
      if (decoded.isGoogleRegistration && decoded.pendingUserData) {
        const { pendingUserData } = decoded;

        // Check OTP validity
        if (pendingUserData.otp !== otp) {
          return res.status(400).json({ message: "Invalid OTP" });
        }

        const otpExpires = new Date(pendingUserData.otpExpires);
        if (otpExpires < new Date()) {
          return res.status(400).json({ message: "OTP has expired. Please register again." });
        }

        // OTP is valid - NOW create the user in the database
        const freePlan = await Plan.findOne({ name: "Free", status: "active" });

        if (!freePlan) {
          return res.status(400).json({ message: "Free plan is not configured. Please contact support." });
        }

        const user = new User({
          email: pendingUserData.email,
          firstName: pendingUserData.firstName,
          lastName: pendingUserData.lastName,
          profilePicture: pendingUserData.profilePicture,
          googleId: pendingUserData.googleId,
          phone: "",
          isVerified: true, // Mark as verified since OTP is correct
          credits: {
            emailCredits: {
              current: freePlan.features.emailCredits?.max || 0,
              max: freePlan.features.emailCredits?.max || 0,
            },
            phoneCredits: {
              current: freePlan.features.phoneCredits?.max || 0,
              max: freePlan.features.phoneCredits?.max || 0,
            },
            verificationCredits: {
              current: freePlan.features.verificationCredits?.max || 0,
              max: freePlan.features.verificationCredits?.max || 0,
            },
            exportCredits: {
              current: freePlan.features.exportCredits?.max || 0,
              max: freePlan.features.exportCredits?.max || 0,
            },
          },
          plan: freePlan._id,
        });
        await user.save();

        // Add user email to plan's assigned list
        await Plan.findByIdAndUpdate(freePlan._id, { $addToSet: { assigned: pendingUserData.email.toLowerCase() } });

        // Create a free subscription for the user
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime subscription

         const newSubscription = new Subscription({
          user: user._id,
          plan: freePlan._id,
          planModel: 'Plan',
          startDate,
          endDate,
          status: "active",
          billingCycle: "lifetime",
        });

        const savedSubscription = await newSubscription.save();
        user.subscription = savedSubscription._id;
        await user.save();

        // Issue JWT and return success - DON'T fall through to regular OTP
        const jwtToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: "7d" },
        );

        user.token = jwtToken;
        await user.save();

        await user.populate("plan");
        await user.populate("subscription");

        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        return res.status(200).json({
          message: "Registration verified successfully!",
          accessToken: jwtToken,
          user: {
            _id: user._id,
            username: fullName || user.email,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            plan: user.plan,
            subscription: user.subscription,
            credits: user.credits,
            profilePicture: user.profilePicture,
            company: user.company,
          },
        });
      }

      // Regular OTP verification for existing users
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }

      // Check OTP validity
      if (!user.verificationOTP || user.verificationOTP !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (!user.otpExpires || user.otpExpires < new Date()) {
        return res.status(400).json({ message: "OTP has expired. Please login again to resend." });
      }

      // Mark user as verified and clear OTP fields
      user.isVerified = true;
      user.verificationOTP = null;
      user.otpExpires = null;

      // Issue a full-access JWT
      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      user.token = jwtToken;
      await user.save();

      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      res.status(200).json({
        message: "Email verified successfully!",
        accessToken: jwtToken,
        user: {
          id: user._id,
          username: fullName || user.email,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong during OTP verification" });
    }
  },

  telegramAuth: async (req, res) => {
    const callbackURL =
      "https://783e-103-69-150-70.ngrok-free.app/api/auth/telegram/callback"; // Use your production URL in the future
    const authUrl = `https://telegram.me/${TELEGRAM_BOT_USERNAME}?start=auth`;
    res.redirect(authUrl);
  },

  telegramCallback: async (req, res) => {
    const { hash, ...data } = req.body;
    const secret = process.env.TELEGRAM_BOT_TOKEN;
    const telegramId = req.body.id;

    // Sort data and create the data check string
    const dataCheckArr = Object.keys(data).map((key) => `${key}=${data[key]}`);
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    // Create the hash
    const secretKey = crypto
      .createHash("sha256")
      .update(secret, "utf8")
      .digest();
    const hashCheck = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Verify hash
    if (hash !== hashCheck) {
      return res.status(403).json({ message: "Invalid hash" });
    }

    // Check if the auth data is outdated
    if (Date.now() / 1000 - data.auth_date > 86400) {
      return res.status(403).json({ message: "Auth data is outdated" });
    }

    try {
      // Step 2: Create or update user
      let user = await User.findOne({ telegramId: telegramId });

      if (!user) {
        // If the user doesn't exist, create a new one
        const freePlan = await Plan.findOne({ name: "Free", status: "active" });

        if (!freePlan) {
          return res.status(400).json({ message: "Free plan is not configured. Please contact support." });
        }

        // Create new user if it doesn't exist
        user = new User({
          firstName: req.body.first_name,
          lastName: req.body.last_name,
          username: req.body.username,
          telegramId: telegramId,
          profilePicture: req.body.photo_url,
          phone: "",
          plan: freePlan._id,
          credits: {
            emailCredits: {
              current: freePlan.features.emailCredits?.max || 0,
              max: freePlan.features.emailCredits?.max || 0,
            },
            phoneCredits: {
              current: freePlan.features.phoneCredits?.max || 0,
              max: freePlan.features.phoneCredits?.max || 0,
            },
            verificationCredits: {
              current: freePlan.features.verificationCredits?.max || 0,
              max: freePlan.features.verificationCredits?.max || 0,
            },
            exportCredits: {
              current: freePlan.features.exportCredits?.max || 0,
              max: freePlan.features.exportCredits?.max || 0,
            },
          },
        });
        await user.save();

        // Create a free subscription for the user
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime subscription

         const newSubscription = new Subscription({
          user: user._id,
          plan: freePlan._id,
          planModel: 'Plan',
          startDate,
          endDate,
          status: "active",
          billingCycle: "lifetime",
        });

        const savedSubscription = await newSubscription.save();
        user.subscription = savedSubscription._id;
        await user.save();
      } else {
        // Update existing user if necessary
        user.firstName = req.body.first_name;
        user.username = req.body.username;
        user.profilePicture = req.body.photo_url;
        await user.save();
      }

      // Step 3: Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      // Send response with the token
      res.status(200).json({
        message: "Telegram authentication successful",
        accessToken: jwtToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          username: user.username,
          profilePicture: user.profilePicture,
          role: user.role,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Something went wrong during Telegram authentication" });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.user.userId)
        .select("-password")
        .populate("plan", "name features.limits");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          message: "Email not verified. Please verify your email to continue.",
          needsVerification: true,
        });
      }

      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      const userData = {
        ...user.toObject(),
        username: fullName || user.email,
      };

      // Include team context from DB
      if (user.teamId) {
        userData.teamId = user.teamId;
        userData.ownerId = user.invitedBy;
        userData.teamRole = req.user.teamRole; // Use resolved role from middleware
      }

      res.status(200).json(userData);
    } catch (error) {
      console.error("[getMe Error]", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  linkedinLogin: (req, res) => {
    // LinkedIn credentials must be configured in environment or system settings.
    if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
      return res
        .status(500)
        .json({ message: "LinkedIn OAuth is not configured on the server." });
    }

    // Build the redirect URI exactly as it will be used during token exchange.
    // Encoding will be handled automatically by the URL string itself; passing an
    // already encoded value was causing a redirect_uri mismatch with LinkedIn.
    const redirectUri = `${SERVER_URL}/api/auth/linkedin`;

    // Optional: add a state parameter to mitigate CSRF (not stored in this
    // example but could be kept in a cookie/session if needed).
    const state = crypto.randomBytes(16).toString("hex");

    const linkedinAuthUrl =
      `https://www.linkedin.com/oauth/v2/authorization` +
      `?response_type=code` +
      `&client_id=${LINKEDIN_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=r_liteprofile%20r_emailaddress` +
      `&state=${state}`;

    res.redirect(linkedinAuthUrl);
  },

  linkedinAuth: async (req, res) => {
    try {
      if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
        return res
          .status(500)
          .send({ message: "LinkedIn OAuth is not configured on the server." });
      }

      const { code } = req.query;

      if (!code) {
        return res
          .status(400)
          .send({ message: "Authorization code not provided" });
      }

      const redirectUri = `${SERVER_URL}/api/auth/linkedin`;

      // exchange authorization code for access token
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      });

      const tokenResponse = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const { access_token } = tokenResponse.data;

      // LinkedIn returns profile and email via separate endpoints when using the
      // standard r_liteprofile/r_emailaddress scopes. The OIDC /userinfo endpoint
      // is still available but sometimes misconfigured; switching to the two-step
      // approach makes the flow more reliable.
      const profileResponse = await axios.get("https://api.linkedin.com/v2/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const emailResponse = await axios.get(
        "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
        { headers: { Authorization: `Bearer ${access_token}` } },
      );

      // parse basic fields
      const firstName =
        profileResponse.data.localizedFirstName || profileResponse.data.firstName?.localized?.en_US || "";
      const lastName =
        profileResponse.data.localizedLastName || profileResponse.data.lastName?.localized?.en_US || "";

      let email = "";
      if (
        emailResponse.data.elements &&
        emailResponse.data.elements[0] &&
        emailResponse.data.elements[0]["handle~"]
      ) {
        email = emailResponse.data.elements[0]["handle~"].emailAddress;
      }

      // try to find a picture URL (LinkedIn nested structure)
      let picture = "";
      try {
        const pics =
          profileResponse.data.profilePicture?.["displayImage~"]?.elements;
        if (Array.isArray(pics) && pics.length) {
          const identifiers = pics[pics.length - 1].identifiers;
          if (Array.isArray(identifiers) && identifiers.length) {
            picture = identifiers[0].identifier;
          }
        }
      } catch (e) {
        // ignore, picture is optional
      }

      let user = await User.findOne({ email });

      if (!user) {
        const freePlan = await Plan.findOne({ name: "Free", status: "active" });

        if (!freePlan) {
          return res.status(400).json({ message: "Free plan is not configured. Please contact support." });
        }

        user = new User({
          email,
          firstName,
          lastName,
          profilePicture: picture,
          linkedInId: profileResponse.data.id || undefined,
          phone: "",
          plan: freePlan._id,
          credits: {
            emailCredits: {
              current: freePlan.features.emailCredits?.max || 0,
              max: freePlan.features.emailCredits?.max || 0,
            },
            phoneCredits: {
              current: freePlan.features.phoneCredits?.max || 0,
              max: freePlan.features.phoneCredits?.max || 0,
            },
            verificationCredits: {
              current: freePlan.features.verificationCredits?.max || 0,
              max: freePlan.features.verificationCredits?.max || 0,
            },
            exportCredits: {
              current: freePlan.features.exportCredits?.max || 0,
              max: freePlan.features.exportCredits?.max || 0,
            },
          },
        });

        await user.save();

        // Add user email to plan's assigned list
        await Plan.findByIdAndUpdate(freePlan._id, { $addToSet: { assigned: email.toLowerCase() } });

        // Create a free subscription for the user
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime subscription

         const newSubscription = new Subscription({
          user: user._id,
          plan: freePlan._id,
          planModel: 'Plan',
          startDate,
          endDate,
          status: "active",
          billingCycle: "lifetime",
        });

        const savedSubscription = await newSubscription.save();
        user.subscription = savedSubscription._id;
        await user.save();
      } else if (!user.linkedInId) {
        user.linkedInId = profileResponse.data.id;
        await user.save();
      }

      const jwtToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      user.token = jwtToken;
      await user.save();

      res.redirect(
        `${CLIENT_URL}/linkedin-auth-success?token=${jwtToken}&userId=${user._id}&email=${user.email}&firstName=${user.firstName}&lastName=${user.lastName}&role=${user.role}`,
      );
    } catch (error) {
      console.error(
        "Error during LinkedIn auth:",
        error.response?.data || error.message,
      );

      res.status(500).json({
        message: "LinkedIn login failed",
        error: error.message,
      });
    }
  },

  setPassword: async (req, res) => {
    try {
      const { password, confirmPassword, otp } = req.body;

      // Validate inputs
      if (!password || !confirmPassword) {
        return res.status(400).json({ message: "Password and confirm password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      if (!otp) {
        return res.status(400).json({ message: "OTP is required" });
      }

      const userId = req.user.userId || req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if password already exists
      if (user.password) {
        return res.status(400).json({ message: "Password already set. Use forgot password to change it." });
      }

      // Verify OTP
      if (!user.verificationOTP || user.verificationOTP !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      if (!user.otpExpires || user.otpExpires < new Date()) {
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }

      // Clear OTP after successful verification
      user.verificationOTP = null;
      user.otpExpires = null;

      // Hash and save
      const bcrypt = require("bcryptjs");
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password set successfully",
      });
    } catch (error) {
      console.error("Set password error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },

  requestSetPasswordOtp: async (req, res) => {
    try {
      const userId = req.user.userId || req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow if user has no password
      if (user.password) {
        return res.status(400).json({ message: "Password already set. Use forgot password to change it." });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.verificationOTP = otp;
      user.otpExpires = otpExpires;
      await user.save();

      // Send OTP via email
      try {
        const { sendOtpEmail } = require("../utils/emailService");
        await sendOtpEmail(user.email, otp, user.firstName);
      } catch (emailError) {
        console.error("Failed to send set-password OTP email:", emailError.message);
        // Still return success — OTP is stored, user can request again
      }

      res.status(200).json({
        success: true,
        message: "OTP sent to your email",
      });
    } catch (error) {
      console.error("Request set-password OTP error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check rate limiting
      const { isRateLimited, generateResetToken, sendPasswordResetEmail } = require("../services/passwordResetService");

      if (isRateLimited(normalizedEmail)) {
        return res.status(429).json({
          message: "Too many requests. Please try again later.",
        });
      }

      // Try to find in User collection first (primary email or alternative email)
      let user = await User.findOne({ email: normalizedEmail });
      let isAdmin = false;

      // If not found by primary email, check alternativeEmails
      if (!user) {
        user = await User.findOne({ alternativeEmails: normalizedEmail });
      }

      // If still not found in User, try Admin collection
      if (!user) {
        user = await Admin.findOne({ email: normalizedEmail });
        isAdmin = !!user;
      }

      // Check if user exists
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Check if user has social login only (no password)
      if (!user.password && (user.googleId || user.linkedInId || user.telegramId)) {
        return res.status(400).json({
          message: "This account uses social login (Google/LinkedIn/Telegram). Please sign in with your social account instead.",
        });
      }

      // Generate secure reset token
      const { rawToken, hashedToken } = generateResetToken();

      // Store hashed token and expiration
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();

      // Send reset email to the email that was requested (work or alternative)
      try {
        await sendPasswordResetEmail(normalizedEmail, rawToken, user.firstName, isAdmin ? "admin" : "user");
      } catch (emailError) {
        // Still return success to prevent email enumeration, but log the error
        // Token is stored, user can request again later
        console.error("   Email send failed:", emailError.message);
      }

      res.status(200).json({
        message: "If this email exists, a reset link has been sent",
      });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong" });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;


      // Validate inputs
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      // Validate password strength (min 8 characters)
      if (newPassword.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters long",
        });
      }

      // Hash the token to compare with stored token
      const crypto = require("crypto");
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

      // Try to find user in User collection first
      let user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() }, // Token still valid
      });

      // If not found in User, try Admin collection
      if (!user) {
        user = await Admin.findOne({
          resetPasswordToken: hashedToken,
          resetPasswordExpires: { $gt: new Date() },
        });
      }

      if (!user) {
        // Check if any user has a reset token (for debugging)
        const usersWithTokens = await User.find({ 
          resetPasswordToken: { $exists: true, $ne: null } 
        }).select("email resetPasswordExpires");
        usersWithTokens.forEach(u => {
        });

        return res.status(400).json({
          message: "Invalid or expired reset token",
        });
      }

      // Hash new password
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and clear reset token fields
      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();


      res.status(200).json({
        message: "Password reset successful. You can now log in with your new password.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },
};

module.exports = authController;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Account = require("../models/Account");
const Plan = require("../models/Plans");
const Subscription = require("../models/Subscription");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const { sendOtpEmail } = require("../utils/emailService");

/* ================================
   ✅ ENV CONFIG
================================ */

const SERVER_URL = process.env.SERVER_URL || "http://localhost:4000";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authController = {
  // ====================================
  // 📝 USER REGISTRATION
  // ====================================
  registration: async (req, res) => {
    try {
      const {
        email,
        company,
        firstName,
        lastName,
        countryCode,
        password,
      } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Check if account already exists
      const existingAccount = await Account.findOne({ email });
      if (existingAccount) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Get Free Plan from database
      const freePlan = await Plan.findOne({ name: "Free", status: "active" });
      if (!freePlan) {
        return res.status(400).json({ message: "Free plan is not configured. Please contact support." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate 6-digit OTP (15 minute expiry)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

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

      // Create account with USER role (cannot be overridden)
      const newAccount = new Account({
        email,
        company,
        firstName,
        lastName,
        countryCode: formattedCountryCode || "+1",
        password: hashedPassword,
        role: "USER", // 🔒 ENFORCED: Always USER for signup
        provider: "local",
        isVerified: false,
        verificationOTP: otp,
        otpExpires,
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

      const savedAccount = await newAccount.save();

      // Add user email to plan's assigned list
      await Plan.findByIdAndUpdate(freePlan._id, { $addToSet: { assigned: email.toLowerCase() } });

      // Create free subscription
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 100);

      const newSubscription = new Subscription({
        user: savedAccount._id,
        plan: freePlan._id,
        planModel: 'Plan',
        startDate,
        endDate,
        status: "active",
        billingCycle: "lifetime",
      });

      const savedSubscription = await newSubscription.save();
      savedAccount.subscription = savedSubscription._id;
      await savedAccount.save();

      // 🔐 CRITICAL: Send OTP email BEFORE returning success
      // If email fails, rollback account creation to maintain data consistency
      try {
        await sendOtpEmail(email, otp, savedAccount.firstName);
      } catch (mailErr) {
        console.error("Failed to send OTP email:", mailErr.message);
        
        // 🔐 ROLLBACK: Delete the account to prevent "Email already in use" on retry
        await Account.findByIdAndDelete(savedAccount._id);
        await Subscription.findByIdAndDelete(savedSubscription._id);
        
        // Return error with helpful message
        return res.status(500).json({
          error: "Email verification failed",
          message: "Could not send verification email. Please try again.",
          details: mailErr.message,
        });
      }

      // Issue temporary verification token
      const tempToken = jwt.sign(
        { accountId: savedAccount._id, needsVerification: true },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.status(201).json({
        message: "Account created. Please verify your email.",
        needsVerification: true,
        tempToken,
        account: {
          id: savedAccount._id,
          email: savedAccount.email,
          firstName: savedAccount.firstName,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  },

  // ====================================
  // ✅ VERIFY REGISTRATION OTP
  // ====================================
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

      const account = await Account.findById(decoded.accountId);

      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (account.isVerified) {
        return res.status(400).json({ message: "Account is already verified" });
      }

      if (!account.verificationOTP || account.verificationOTP !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (!account.otpExpires || account.otpExpires < new Date()) {
        return res.status(400).json({ message: "OTP has expired" });
      }

      // Verify account
      account.isVerified = true;
      account.verificationOTP = null;
      account.otpExpires = null;
      await account.save();

      // Issue full access token
      const accessToken = jwt.sign(
        { sub: account._id, userId: account._id, role: account.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // 🔒 STATELESS JWT: Token NOT stored in database

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.status(200).json({
        message: "Email verified successfully",
        accessToken,
        account: {
          id: account._id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
        },
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  },

  // ====================================
  // 🔑 USER LOGIN (role: USER)
  // ====================================
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const account = await Account.findOne({ email });

      if (!account) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // 🔐 CRITICAL: Always require password verification
      const isPasswordValid = await bcrypt.compare(password, account.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // 🔒 ROLE VALIDATION: Only USER role can login here
      if (account.role !== "USER") {
        return res.status(403).json({
          message: "This account has admin privileges. Use /api/auth/admin-login",
        });
      }

      if (account.isBlocked) {
        return res.status(403).json({ message: "Account is blocked" });
      }

      // Generate JWT with role
      const accessToken = jwt.sign(
        { sub: account._id, userId: account._id, role: account.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // 🔒 STATELESS JWT: Do NOT store token in database

      // Set httpOnly cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Login successful",
        accessToken,
        account: {
          id: account._id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
          company: account.company,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  },

  // ====================================
  // 🔑 ADMIN LOGIN (role: ADMIN)
  // ====================================
  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const account = await Account.findOne({ email });

      if (!account) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // 🔐 CRITICAL: Always require password verification
      const isPasswordValid = await bcrypt.compare(password, account.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // 🔒 ROLE VALIDATION: Only ADMIN role can login here
      if (account.role !== "ADMIN") {
        return res.status(403).json({
          message: "This account does not have admin privileges",
        });
      }

      // Generate JWT with role
      const accessToken = jwt.sign(
        { sub: account._id, userId: account._id, role: account.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // 🔒 STATELESS JWT: Do NOT store token in database

      // Set httpOnly cookie
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Admin login successful",
        accessToken,
        account: {
          id: account._id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Admin login failed" });
    }
  },

  // ====================================
  // 🔐 LOGOUT (Both USER & ADMIN)
  // ====================================
  logout: async (req, res) => {
    try {
      // Clear cookie (frontend will delete token from storage)
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  },

  // ====================================
  // 🔄 REFRESH TOKEN
  // ====================================
  verifyToken: async (req, res) => {
    try {
      const token =
        req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      // Verify JWT signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get account for current data (optional - verify still exists)
      const account = await Account.findById(decoded.sub);

      if (!account || account.isBlocked) {
        return res.status(401).json({ message: "Account not found or blocked" });
      }

      // If token expires in less than 24 hours, issue new token
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      const hoursRemaining = expiresIn / 3600;

      if (hoursRemaining < 24) {
        const newToken = jwt.sign(
          { sub: account._id, userId: account._id, role: account.role },
          process.env.JWT_SECRET,
          { expiresIn: "30d" }
        );

        res.cookie("accessToken", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
          message: "Token refreshed",
          accessToken: newToken,
          account: {
            id: account._id,
            email: account.email,
            role: account.role,
          },
        });
      }

      // Token still valid, return current info
      res.status(200).json({
        message: "Token valid",
        accessToken: token,
        account: {
          id: account._id,
          email: account.email,
          role: account.role,
        },
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      console.error("Token verification error:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  },

  // ====================================
  // 🌐 GOOGLE OAUTH
  // ====================================
  googleAuth: async (req, res) => {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ message: "Credential required" });
      }

      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { sub: googleId, email, given_name, family_name, picture } = payload;

      if (!email) {
        return res.status(400).json({ message: "Email not provided" });
      }

      // Check if account exists
      let account = await Account.findOne({ email });

      if (account) {
        // Exist account: verify role is USER (not ADMIN)
        if (account.role !== "USER") {
          return res.status(403).json({
            message: "This email is registered as admin. Use /api/auth/admin-login",
          });
        }

        // Link Google ID if not already linked
        if (!account.googleId) {
          account.googleId = googleId;
          account.provider = "google";
          await account.save();
        }
      } else {
        // New account: create with USER role
        const freePlan = await Plan.findOne({ name: "Free", status: "active" });
        if (!freePlan) {
          return res.status(400).json({ message: "Free plan is not configured. Please contact support." });
        }

        account = new Account({
          email,
          firstName: given_name || "User",
          lastName: family_name || email.split("@")[0],
          googleId,
          profilePicture: picture,
          role: "USER", // 🔒 ENFORCED: Always USER for OAuth signup
          provider: "google",
          isVerified: true, // Google OAuth is pre-verified
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

        const savedAccount = await account.save();

        // Add user email to plan's assigned list
        await Plan.findByIdAndUpdate(freePlan._id, { $addToSet: { assigned: email.toLowerCase() } });

        // Create subscription
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 100);

        const subscription = new Subscription({
          user: savedAccount._id,
          plan: freePlan._id,
          planModel: 'Plan',
          startDate,
          endDate,
          status: "active",
          billingCycle: "lifetime",
        });

        const savedSubscription = await subscription.save();
        savedAccount.subscription = savedSubscription._id;
        await savedAccount.save();
      }

      // Issue JWT
      const accessToken = jwt.sign(
        { sub: account._id, userId: account._id, role: account.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Google authentication successful",
        accessToken,
        account: {
          id: account._id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
        },
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ error: "Google authentication failed" });
    }
  },

  // ====================================
  // 🔗 LINKEDIN OAUTH
  // ====================================
  linkedinAuth: async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ message: "Authorization code required" });
      }

      // Exchange code for access token
      const tokenResponse = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        null,
        {
          params: {
            grant_type: "authorization_code",
            code,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET,
            redirect_uri: `${CLIENT_URL}/auth/linkedin/callback`,
          },
        }
      );

      const { access_token } = tokenResponse.data;

      // Get user profile
      const profileResponse = await axios.get(
        "https://api.linkedin.com/v2/me",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const profileData = profileResponse.data;
      const linkedInId = profileData.id;
      const firstName = profileData.localizedFirstName || "User";
      const lastName = profileData.localizedLastName || "";

      // Get email
      const emailResponse = await axios.get(
        "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const email = emailResponse.data.elements[0]["handle~"].emailAddress;

      if (!email) {
        return res.status(400).json({ message: "Could not retrieve email from LinkedIn" });
      }

      // Check if account exists
      let account = await Account.findOne({ email });

      if (account) {
        // Existing account: verify role is USER
        if (account.role !== "USER") {
          return res.status(403).json({
            message: "This email is registered as admin. Use /api/auth/admin-login",
          });
        }

        // Link LinkedIn ID if not already linked
        if (!account.linkedInId) {
          account.linkedInId = linkedInId;
          account.provider = "linkedin";
          await account.save();
        }
      } else {
        // New account: create with USER role
        const freePlan = await Plan.findOne({ name: "Free", status: "active" });
        if (!freePlan) {
          return res.status(400).json({ message: "Free plan is not configured. Please contact support." });
        }

        account = new Account({
          email,
          firstName,
          lastName,
          linkedInId,
          role: "USER", // 🔒 ENFORCED: Always USER for OAuth signup
          provider: "linkedin",
          isVerified: true,
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

        const savedAccount = await account.save();

        // Add user email to plan's assigned list
        await Plan.findByIdAndUpdate(freePlan._id, { $addToSet: { assigned: email.toLowerCase() } });

        // Create subscription
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 100);

        const subscription = new Subscription({
          user: savedAccount._id,
          plan: freePlan._id,
          planModel: 'Plan',
          startDate,
          endDate,
          status: "active",
          billingCycle: "lifetime",
        });

        const savedSubscription = await subscription.save();
        savedAccount.subscription = savedSubscription._id;
        await savedAccount.save();
      }

      // Issue JWT
      const accessToken = jwt.sign(
        { sub: account._id, userId: account._id, role: account.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "LinkedIn authentication successful",
        accessToken,
        account: {
          id: account._id,
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
        },
      });
    } catch (error) {
      console.error("LinkedIn auth error:", error);
      res.status(500).json({ error: "LinkedIn authentication failed" });
    }
  },

  // ====================================
  // 🤖 TELEGRAM BOT AUTH
  // ====================================
  telegramAuth: async (req, res) => {
    try {
      const { hash, data } = req.body;

      if (!hash || !data) {
        return res.status(400).json({ message: "Hash and data required" });
      }

      // Verify Telegram hash (simplified - implement full verification in production)
      // See: https://core.telegram.org/widgets/login

      const account = await Account.findOne({ telegramId: data.id });

      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (account.role !== "USER") {
        return res.status(403).json({
          message: "This account has admin privileges",
        });
      }

      const accessToken = jwt.sign(
        { sub: account._id, userId: account._id, role: account.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "Telegram authentication successful",
        accessToken,
        account: {
          id: account._id,
          email: account.email,
          role: account.role,
        },
      });
    } catch (error) {
      console.error("Telegram auth error:", error);
      res.status(500).json({ error: "Telegram authentication failed" });
    }
  },

  // ====================================
  // 📧 VERIFY OTP (for email verification)
  // ====================================
  verifyOtp: async (req, res) => {
    try {
      const { otp } = req.body;
      const authHeader = req.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      let decoded;

      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const account = await Account.findById(decoded.sub);

      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (!account.verificationOTP || account.verificationOTP !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (!account.otpExpires || account.otpExpires < new Date()) {
        return res.status(400).json({ message: "OTP expired" });
      }

      account.isVerified = true;
      account.verificationOTP = null;
      account.otpExpires = null;
      await account.save();

      res.status(200).json({
        message: "Verification successful",
        account: {
          id: account._id,
          email: account.email,
          isVerified: true,
        },
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  },

  // ====================================
  // 🔐 RESEND OTP
  // ====================================
  resendOtp: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      const account = await Account.findOne({ email });

      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (account.isVerified) {
        return res.status(400).json({ message: "Account already verified" });
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

      account.verificationOTP = otp;
      account.otpExpires = otpExpires;
      await account.save();

      // 🔐 Send OTP - fail if email sending fails
      try {
        await sendOtpEmail(email, otp, account.firstName);
      } catch (mailErr) {
        console.error("Failed to send OTP:", mailErr.message);
        return res.status(500).json({
          error: "Email send failed",
          message: "Could not send verification email. Please try again.",
          details: mailErr.message,
        });
      }

      // Issue temporary token
      const tempToken = jwt.sign(
        { accountId: account._id, needsVerification: true },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.status(200).json({
        message: "OTP sent to email",
        tempToken,
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ error: "Failed to resend OTP" });
    }
  },
};

module.exports = authController;

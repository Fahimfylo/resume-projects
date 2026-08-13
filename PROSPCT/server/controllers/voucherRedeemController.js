const crypto = require("crypto");
const Voucher = require("../models/Voucher");
const SpecialDeal = require("../models/SpecialDeal");
const User = require("../models/User");
const Plan = require("../models/Plans");
const Subscription = require("../models/Subscription");
const CreditLedger = require("../models/CreditLedger");
const VoucherRedemptionLog = require("../models/VoucherRedemptionLog");
const ActivePackage = require("../models/ActivePackage");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

async function matchDeal(payload) {
  const planCodes = payload?.plan?.codes || payload?.plan_codes;
  const price = payload?.pricing?.amount || payload?.pricing?.priceUSD;

  if (planCodes) {
    const deal = await SpecialDeal.findOne({ codes: planCodes, isActive: true }).lean();
    if (deal) return deal;
  }

  if (price) {
    return SpecialDeal.findOne({ priceUSD: price, isActive: true }).lean();
  }

  return null;
}

async function resolveDealFromVoucher(voucher) {
  let deal = null;
  if (voucher.payload) {
    deal = await matchDeal(voucher.payload);
  }
  if (!deal) {
    deal = await SpecialDeal.findOne({ code: (voucher.voucherCode || "").split("-")[0], isActive: true }).lean();
  }
  return deal;
}

function grantCreditsToUser(user, credits) {
  const increments = {};
  const emailCredits = credits.emailCredits || 0;
  const phoneCredits = credits.phoneCredits || 0;
  const verificationCredits = credits.verificationCredits || 0;
  const exportCredits = credits.exportCredits || 0;
  const maxCredits = Math.max(emailCredits, phoneCredits, verificationCredits, exportCredits);

  if (maxCredits > 0) {
    increments["credits.emailCredits.current"] = emailCredits || maxCredits;
    increments["credits.emailCredits.max"] = emailCredits || maxCredits;
    increments["credits.phoneCredits.current"] = phoneCredits || maxCredits;
    increments["credits.phoneCredits.max"] = phoneCredits || maxCredits;
    increments["credits.verificationCredits.current"] = verificationCredits || maxCredits;
    increments["credits.verificationCredits.max"] = verificationCredits || maxCredits;
  }
  if (exportCredits > 0 || maxCredits > 0) {
    increments["credits.exportCredits.current"] = exportCredits || maxCredits;
    increments["credits.exportCredits.max"] = exportCredits || maxCredits;
  }
  const dealName = credits._dealName || "";
  const setFields = {};
  if (dealName) {
    setFields.redeemedDeal = dealName;
    setFields.planType = "custom";
  }
  return User.findByIdAndUpdate(
    user._id,
    {
      $inc: increments,
      $set: Object.keys(setFields).length > 0 ? {
        ...setFields,
        "limits.csvEnrichment": true,
        "limits.technologyFilter": true,
        "limits.jobPostingFilter": true,
        "limits.revenueFilter": true,
        "limits.fundingFilter": true,
        "limits.basicIntegrations": true,
        "limits.jobChangeFilter": true,
        "limits.duplicateControl": true,
        "limits.hubspotIntegration": true,
        "limits.salesforceIntegration": true,
        "limits.jobChangeTracking": true,
      } : {},
    },
    { new: true }
  );
}

function logCreditLedger(userId, deal, referenceId) {
  const entries = [];
  const emailCredits = deal.emailCredits || 0;
  const phoneCredits = deal.phoneCredits || 0;
  const verificationCredits = deal.verificationCredits || 0;
  const exportCredits = deal.exportCredits || 0;
  const maxCredits = Math.max(emailCredits, phoneCredits, verificationCredits, exportCredits);

  if (maxCredits > 0) {
    entries.push({ userId, creditType: "EMAIL", transactionType: "PURCHASE", amount: emailCredits || maxCredits, balanceAfter: emailCredits || maxCredits, referenceId, metadata: { dealCode: deal.code } });
    entries.push({ userId, creditType: "PHONE", transactionType: "PURCHASE", amount: phoneCredits || maxCredits, balanceAfter: phoneCredits || maxCredits, referenceId, metadata: { dealCode: deal.code } });
    entries.push({ userId, creditType: "VERIFICATION", transactionType: "PURCHASE", amount: verificationCredits || maxCredits, balanceAfter: verificationCredits || maxCredits, referenceId, metadata: { dealCode: deal.code } });
    entries.push({ userId, creditType: "EXPORT", transactionType: "PURCHASE", amount: exportCredits || maxCredits, balanceAfter: exportCredits || maxCredits, referenceId, metadata: { dealCode: deal.code } });
  }
  if (entries.length > 0) {
    return CreditLedger.insertMany(entries);
  }
}

async function findVoucherByIdentifier(tokenOrCode) {
  if (!tokenOrCode) return null;
  let voucher = await Voucher.findOne({ redeemToken: tokenOrCode.trim() });
  if (!voucher) {
    voucher = await Voucher.findOne({ voucherCode: tokenOrCode.trim() });
  }
  return voucher;
}

async function validateVoucher(tokenOrCode) {
  const voucher = await findVoucherByIdentifier(tokenOrCode);
  if (!voucher) {
    return { valid: false, message: "Invalid voucher code." };
  }

  if (voucher.redeemedBy) {
    return { valid: false, message: "This voucher has already been redeemed." };
  }

  if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
    return { valid: false, message: "This voucher has expired." };
  }

  const deal = await resolveDealFromVoucher(voucher);
  if (!deal) {
    return { valid: false, message: "No matching offer found for this voucher." };
  }

  if (!deal.isActive) {
    return { valid: false, message: "The offer associated with this voucher is no longer active." };
  }

  if (deal.expiresAt && new Date(deal.expiresAt) < new Date()) {
    return { valid: false, message: "The offer associated with this voucher has expired." };
  }

  const credits = voucher.perRedeemCredits || {};
  const emailCredits = credits.emailCredits || 0;
  const phoneCredits = credits.phoneCredits || 0;
  const verificationCredits = credits.verificationCredits || 0;
  const exportCredits = credits.exportCredits || 0;
  const equalCredits = Math.max(emailCredits, phoneCredits, verificationCredits, exportCredits);

  return {
    valid: true,
    voucher,
    deal: {
      _id: deal._id,
      code: deal.code,
      description: deal.description,
      discount: deal.discount,
      priceUSD: deal.priceUSD,
      originalPriceUSD: deal.originalPriceUSD,
      emailCredits: equalCredits,
      phoneCredits: equalCredits,
      verificationCredits: equalCredits,
      exportCredits: equalCredits,
      emailSeats: credits.emailSeats || 0,
    },
  };
}

const voucherRedeemController = {
  validateVoucher: async (req, res) => {
    try {
      const { code, token } = req.params;
      const identifier = token || code;
      if (!identifier) {
        return res.status(400).json({ success: false, message: "Voucher code or token is required." });
      }

      const result = await validateVoucher(identifier);
      if (!result.valid) {
        logger.warn({ msg: "[REDEEM] Voucher validation failed", identifier, reason: result.message });
        return res.status(400).json({ success: false, message: result.message });
      }

      logger.info({ msg: "[REDEEM] Voucher validated successfully", identifier, deal: result.deal?.code });
      return res.status(200).json({
        success: true,
        message: "Voucher is valid.",
        deal: result.deal,
      });
    } catch (error) {
      logger.error({ msg: "[REDEEM] Error validating voucher", identifier: req.params.code || req.params.token, error: error.message });
      return res.status(500).json({ success: false, message: "Error validating voucher." });
    }
  },

  redeemVoucher: async (req, res) => {
    try {
      const { code, token } = req.body;
      const identifier = token || code;
      const userId = req.user?.id || req.user?._id;

      if (!identifier) {
        return res.status(400).json({ success: false, message: "Voucher code or token is required." });
      }
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }

      const result = await validateVoucher(identifier);
      if (!result.valid) {
        logger.warn({ msg: "[REDEEM] Redemption failed - invalid voucher", identifier, userId, reason: result.message });
        await VoucherRedemptionLog.create({
          voucherCode: identifier,
          userId,
          status: "failed",
          source: "redeem",
          errorMessage: result.message,
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "",
        });
        return res.status(400).json({ success: false, message: result.message });
      }

      const { voucher, deal } = result;

      const user = await User.findById(userId);
      if (!user) {
        logger.warn({ msg: "[REDEEM] User not found", userId, identifier });
        return res.status(404).json({ success: false, message: "User not found." });
      }

      const credits = voucher.perRedeemCredits || {};
      const dealName = deal.codes
        ? `${deal.codes} Code${deal.codes > 1 ? 's' : ''} package`
        : (deal.code || deal.description || "");

      await grantCreditsToUser(user, { ...credits, _dealName: dealName });
      await logCreditLedger(userId, credits, `voucher-${voucher.voucherCode}`);

      voucher.redeemedBy = userId;
      voucher.redeemedAt = new Date();
      await voucher.save();

      const nextRenewal = new Date();
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);

      await ActivePackage.create({
        user: userId,
        voucher: voucher._id,
        deal: deal._id,
        activatedAt: new Date(),
        nextRenewalAt: nextRenewal,
        creditsPerRenewal: {
          emailCredits: credits.emailCredits || 0,
          phoneCredits: credits.phoneCredits || 0,
          verificationCredits: credits.verificationCredits || 0,
          exportCredits: credits.exportCredits || 0,
          emailSeats: credits.emailSeats || 0,
        },
        status: "active",
      });

      await SpecialDeal.findByIdAndUpdate(deal._id, { $inc: { timesRedeemed: 1 } });

      const respEmail = credits.emailCredits || 0;
      const respPhone = credits.phoneCredits || 0;
      const respVerification = credits.verificationCredits || 0;
      const respExport = credits.exportCredits || 0;
      const equalGranted = Math.max(respEmail, respPhone, respVerification, respExport);

      await VoucherRedemptionLog.create({
        voucherCode: voucher.voucherCode,
        voucherId: voucher._id,
        userId,
        status: "success",
        source: "redeem",
        credits: {
          emailCredits: equalGranted,
          phoneCredits: equalGranted,
          verificationCredits: equalGranted,
          exportCredits: equalGranted,
          emailSeats: credits.emailSeats || 0,
        },
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
      });

      logger.info({ msg: "[REDEEM] Voucher redeemed successfully", identifier, userId, voucherCode: voucher.voucherCode, dealCode: deal.code });

      return res.status(200).json({
        success: true,
        message: "Voucher redeemed successfully! Credits have been added to your account.",
        credits: {
          emailCredits: equalGranted,
          phoneCredits: equalGranted,
          verificationCredits: equalGranted,
          exportCredits: equalGranted,
        },
      });
    } catch (error) {
      logger.error({ msg: "[REDEEM] Error redeeming voucher", identifier: req.body.code || req.body.token, userId: req.user?.id, error: error.message, stack: error.stack });
      return res.status(500).json({ success: false, message: "Error redeeming voucher." });
    }
  },

  registerAndRedeem: async (req, res) => {
    try {
      const { email, firstName, lastName, password, company, voucherCode, token } = req.body;
      const identifier = token || voucherCode;

      logger.info({ msg: "[REDEEM] Register-and-redeem attempt", email, hasIdentifier: !!identifier });

      if (!email || !firstName || !lastName || !password || !identifier) {
        return res.status(400).json({
          success: false,
          message: "Email, first name, last name, password, and voucher code/token are required.",
        });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        await VoucherRedemptionLog.create({
          voucherCode: identifier,
          email,
          status: "failed",
          source: "register-and-redeem",
          errorMessage: "Account already exists",
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "",
        });
        return res.status(400).json({ success: false, message: "An account with this email already exists. Please log in instead." });
      }

      const result = await validateVoucher(identifier);
      if (!result.valid) {
        await VoucherRedemptionLog.create({
          voucherCode: identifier,
          email,
          status: "failed",
          source: "register-and-redeem",
          errorMessage: result.message,
          ip: req.ip,
          userAgent: req.headers["user-agent"] || "",
        });
        return res.status(400).json({ success: false, message: result.message });
      }

      const { voucher, deal } = result;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const freePlan = await Plan.findOne({ name: "Free", status: "active" });
      if (!freePlan) {
        return res.status(400).json({ success: false, message: "Free plan is not configured." });
      }

      const newUser = new User({
        email: email.toLowerCase(),
        company: company || "",
        firstName,
        lastName,
        countryCode: "+1",
        phone: "",
        password: hashedPassword,
        isVerified: true,
        invitedBy: null,
        credits: {
          emailCredits: { current: 0, max: 0 },
          phoneCredits: { current: 0, max: 0 },
          verificationCredits: { current: 0, max: 0 },
          exportCredits: { current: 0, max: 0 },
        },
        plan: freePlan._id,
        subscription: null,
      });

      const savedUser = await newUser.save();
      await Plan.findByIdAndUpdate(freePlan._id, { $addToSet: { assigned: email.toLowerCase() } });

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 100);

      const newSubscription = new Subscription({
        user: savedUser._id,
        plan: freePlan._id,
        planModel: "Plan",
        startDate,
        endDate,
        status: "active",
        billingCycle: "lifetime",
      });

      const savedSubscription = await newSubscription.save();
      savedUser.subscription = savedSubscription._id;
      await savedUser.save();

      const credits = voucher.perRedeemCredits || {};
      const dealName = deal.codes
        ? `${deal.codes} Code${deal.codes > 1 ? 's' : ''} package`
        : (deal.code || deal.description || "");

      await grantCreditsToUser(savedUser, { ...credits, _dealName: dealName });
      await logCreditLedger(savedUser._id, credits, `voucher-${voucher.voucherCode}`);

      voucher.redeemedBy = savedUser._id;
      voucher.redeemedAt = new Date();
      await voucher.save();

      const nextRenewal = new Date();
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);

      await ActivePackage.create({
        user: savedUser._id,
        voucher: voucher._id,
        deal: deal._id,
        activatedAt: new Date(),
        nextRenewalAt: nextRenewal,
        creditsPerRenewal: {
          emailCredits: credits.emailCredits || 0,
          phoneCredits: credits.phoneCredits || 0,
          verificationCredits: credits.verificationCredits || 0,
          exportCredits: credits.exportCredits || 0,
          emailSeats: credits.emailSeats || 0,
        },
        status: "active",
      });

      await SpecialDeal.findByIdAndUpdate(deal._id, { $inc: { timesRedeemed: 1 } });

      const regEmail = credits.emailCredits || 0;
      const regPhone = credits.phoneCredits || 0;
      const regVerification = credits.verificationCredits || 0;
      const regExport = credits.exportCredits || 0;
      const regGranted = Math.max(regEmail, regPhone, regVerification, regExport);

      await VoucherRedemptionLog.create({
        voucherCode: voucher.voucherCode,
        voucherId: voucher._id,
        userId: savedUser._id,
        email,
        status: "success",
        source: "register-and-redeem",
        credits: {
          emailCredits: regGranted,
          phoneCredits: regGranted,
          verificationCredits: regGranted,
          exportCredits: regGranted,
          emailSeats: credits.emailSeats || 0,
        },
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
      });

      const jwtToken = jwt.sign(
        { userId: savedUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      savedUser.token = jwtToken;
      await savedUser.save();

      return res.status(201).json({
        success: true,
        message: "Account created and voucher redeemed successfully!",
        accessToken: jwtToken,
        user: {
          _id: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
        },
        credits: {
          emailCredits: regGranted,
          phoneCredits: regGranted,
          verificationCredits: regGranted,
          exportCredits: regGranted,
        },
      });
    } catch (error) {
      logger.error({ msg: "[REDEEM] Error in register and redeem", error: error.message, stack: error.stack });
      return res.status(500).json({ success: false, message: "Error creating account and redeeming voucher." });
    }
  },

  getMyPendingVouchers: async (req, res) => {
    try {
      const userId = req.user?.id || req.user?._id || req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }

      const user = await User.findById(userId).lean();
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      const pendingVouchers = await Voucher.find({
        buyerEmail: user.email,
        redeemedBy: null,
      })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: pendingVouchers.length,
        vouchers: pendingVouchers.map((v) => ({
          _id: v._id,
          voucherCode: v.voucherCode,
          redeemToken: v.redeemToken,
          expiresAt: v.expiresAt,
          createdAt: v.createdAt,
        })),
      });
    } catch (error) {
      logger.error({ msg: "[REDEEM] Error fetching pending vouchers", error: error.message });
      return res.status(500).json({ success: false, message: "Error fetching pending vouchers." });
    }
  },

  syncVoucher: async (req, res) => {
    try {
      const { voucherCode, buyerEmail, buyerName, invoiceNumber, planCodes, amount, perRedeemCredits, expiresAt } = req.body;

      if (!voucherCode || !invoiceNumber) {
        return res.status(400).json({ success: false, message: "voucherCode and invoiceNumber are required." });
      }

      const existing = await Voucher.findOne({
        $or: [{ voucherCode }, { invoiceNumber }],
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Voucher already exists (idempotent)",
          code: existing.voucherCode,
          token: existing.redeemToken,
        });
      }

      const redeemToken = crypto.randomUUID ? crypto.randomUUID() : require("uuid").v4();

      const voucher = await Voucher.create({
        voucherCode,
        redeemToken,
        invoiceNumber,
        buyerEmail: buyerEmail || "",
        quantity: planCodes || 1,
        perRedeemCredits: {
          emailCredits: perRedeemCredits?.emailCredits || 0,
          phoneCredits: perRedeemCredits?.phoneCredits || 0,
          verificationCredits: perRedeemCredits?.verificationCredits || 0,
          exportCredits: perRedeemCredits?.exportCredits || 0,
          emailSeats: perRedeemCredits?.emailSeats || 0,
        },
        expiresAt: expiresAt || null,
        payload: { buyer: { email: buyerEmail, name: buyerName }, plan: { codes: planCodes }, pricing: { amount } },
      });

      console.log(`[SYNC-VOUCHER] Synced fallback voucher ${voucherCode} for ${buyerEmail || "unknown"}`);

      return res.status(201).json({
        success: true,
        message: "Voucher synced successfully",
        code: voucher.voucherCode,
        token: voucher.redeemToken,
        redeem_url: `${process.env.FRONTEND_URL || "https://app.prospct.io"}/redeem?token=${voucher.redeemToken}`,
      });
    } catch (error) {
      console.error("[SYNC-VOUCHER] Error syncing voucher:", error);
      return res.status(500).json({ success: false, message: "Error syncing voucher." });
    }
  },
};

module.exports = voucherRedeemController;

const SystemSetting = require("../models/SystemSetting");
const { refreshSettingsCache } = require("../utils/systemSettings");

const PERFECT_MONEY_TITLES = ["Perfect Money"];

const stripRemovedMethods = (methods) => {
  if (!Array.isArray(methods)) return methods;
  return methods.filter((m) => !PERFECT_MONEY_TITLES.includes(m.title));
};

// GET settings
// GET settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne({}); // get the only document
    if (!settings) {
      // create a default settings document if it doesn't exist
      settings = new SystemSetting({
        paymentMethods: [
          {
            title: "Credit/Debit Card (alternative)",
            src: "/images/payment-method/Visa-Mastercard.webp",
          },
          {
            title: "Pay Pro Global",
            src: "/images/payment-method/payproglobal.jfif",
          },
          {
            title: "Heleket",
            src: "/images/payment-method/heleket.png",
          },
          {
            title: "Fast Spring",
            src: "/images/payment-method/fast-spring.png",
          },
        ],
      });
      await settings.save();
    }

    // ensure paymentMethods is always set
    if (!settings.paymentMethods || !Array.isArray(settings.paymentMethods)) {
      settings.paymentMethods = [
        {
          title: "Credit/Debit Card (alternative)",
          src: "/images/payment-method/Visa-Mastercard.webp",
        },
        {
          title: "Pay Pro Global",
          src: "/images/payment-method/payproglobal.jfif",
        },
        {
          title: "Heleket",
          src: "/images/payment-method/heleket.png",
        },
        {
          title: "Fast Spring",
          src: "/images/payment-method/fast-spring.png",
        },
      ];
      await settings.save();
    }

    if (Array.isArray(settings.paymentMethods)) {
      settings.paymentMethods = stripRemovedMethods(settings.paymentMethods);
    }
    // send the document as JSON
    res.json(settings);
  } catch (err) {
    console.error("[getSettings] Error:", err);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

// GET public settings (no auth required)
exports.getPublicSettings = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne({});
    if (!settings) {
      settings = new SystemSetting({
        paymentCardOrder: [
          "Credit/Debit Card (alternative)",
          "Pay Pro Global",
          "Heleket",
          "Fast Spring"
        ],
      });
      await settings.save();
    }

    // Only expose allowed public fields
    const publicFields = {
      loginHeroStat: settings.loginHeroStat || "200,00+",
      loginSwiperSlides: Array.isArray(settings.loginSwiperSlides)
        ? settings.loginSwiperSlides
        : [],
    };

    return res.json(publicFields);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch public settings" });
  }
};

// GET layout order (public)
exports.getLayoutOrder = async (req, res) => {
  try {
    let settings = await SystemSetting.findOne({});
    if (!settings) {
      settings = new SystemSetting({
        paymentMethods: [
          {
            title: "Credit/Debit Card (alternative)",
            src: "/images/payment-method/Visa-Mastercard.webp",
          },
          {
            title: "Pay Pro Global",
            src: "/images/payment-method/payproglobal.jfif",
          },
          {
            title: "Heleket",
            src: "/images/payment-method/heleket.png",
          },
          {
            title: "Fast Spring",
            src: "/images/payment-method/fast-spring.png",
          },
        ],
        paymentRedirectMode: "same-tab",
      });
      await settings.save();
    }

    // ensure paymentMethods is always set and non-empty
    if (!settings.paymentMethods || !Array.isArray(settings.paymentMethods) || settings.paymentMethods.length === 0) {
      settings.paymentMethods = [
        {
          title: "Credit/Debit Card (alternative)",
          src: "/images/payment-method/Visa-Mastercard.webp",
        },
        {
          title: "Pay Pro Global",
          src: "/images/payment-method/payproglobal.jfif",
        },
        {
          title: "Heleket",
          src: "/images/payment-method/heleket.png",
        },
        {
          title: "Fast Spring",
          src: "/images/payment-method/fast-spring.png",
        },
      ];
      await settings.save();
    }

    const cleanMethods = stripRemovedMethods(settings.paymentMethods);
    const redirectMode = settings.paymentRedirectMode || "same-tab";
    return res.json({ 
      paymentMethods: cleanMethods,
      paymentRedirectMode: redirectMode,
    });
  } catch (err) {
    console.error("[getLayoutOrder] Error:", err);
    res.status(500).json({ message: "Failed to fetch layout order" });
  }
};

// PUT update settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    // WHITELIST: Only allow specific fields to be updated (prevent mass assignment)
    const ALLOWED_FIELDS = [
      // Core settings
      "maintenanceMode",
      "loginHeroStat",
      "loginSwiperSlides",
      "paymentMethods",
      "paymentCardOrder",
      "paymentRedirectMode",
      // API keys & credentials
      "stripeSecretKey",
      "stripePublishableKey",
      "coinPaymentsPublicKey",
      "coinPaymentsPrivateKey",
      "googleClientId",
      "googleClientSecret",
      "linkedinClientId",
      "linkedinClientSecret",
      "debounceApi",
      "telegramBotUsername",
      "telegramBotToken",
      "payProGlobalEncryptionKey",
      "payProGlobalIV",
      "heleketMerchantId",
      "heleketPaymentApiUrl",
      // SMTP settings
      "smtpHost",
      "smtpPort",
      "smtpSecure",
      "smtpUser",
      "smtpPass",
      "smtpFrom",
        "receiverEmail",

    ];

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    for (const key of Object.keys(updates)) {
      if (ALLOWED_FIELDS.includes(key)) {
        filteredUpdates[key] = updates[key];
      } else {
        console.warn(`[updateSettings] Rejected disallowed field: ${key}`);
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ message: "No valid settings to update" });
    }


    // Update the only document
    let settings = await SystemSetting.findOne({});
    if (!settings) {
      settings = new SystemSetting({
        paymentMethods: [
          {
            title: "Credit/Debit Card (alternative)",
            src: "/images/payment-method/Visa-Mastercard.webp",
          },
          {
            title: "Pay Pro Global",
            src: "/images/payment-method/payproglobal.jfif",
          },
          {
            title: "Heleket",
            src: "/images/payment-method/heleket.png",
          },
          {
            title: "Fast Spring",
            src: "/images/payment-method/fast-spring.png",
          },
        ],
      });
    }

    for (const key in filteredUpdates) {
      if (key === "paymentCardOrder") {
        // Backward compatibility: convert old format to new format
        const defaultMethods = [
          {
            title: "Credit/Debit Card (alternative)",
            src: "/images/payment-method/Visa-Mastercard.webp",
          },
          {
            title: "Pay Pro Global",
            src: "/images/payment-method/payproglobal.jfif",
          },
          {
            title: "Heleket",
            src: "/images/payment-method/heleket.png",
          },
          {
            title: "Fast Spring",
            src: "/images/payment-method/fast-spring.png",
          },
        ];

        // Reorder paymentMethods based on paymentCardOrder
        const orderedMethods = filteredUpdates[key]
          .map((title) => defaultMethods.find((m) => m.title === title))
          .filter(Boolean);

        settings.paymentMethods = orderedMethods;
      } else {
        settings[key] = filteredUpdates[key];
      }
    }

    await settings.save();
    if (Array.isArray(settings.paymentMethods)) {
      settings.paymentMethods = stripRemovedMethods(settings.paymentMethods);
    }
    await refreshSettingsCache();

    res.json({ message: "Settings updated successfully", settings });
  } catch (err) {
    console.error("[updateSettings] Error:", err);
    res.status(500).json({ message: "Failed to update settings" });
  }
};

// POST upload slide image
exports.uploadSlideImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // Construct full URL for the uploaded image (serving from /uploads)
    const url = `${req.protocol}://${req.get("host")}/uploads/images/${req.file.filename}`;

    res.json({ url });
  } catch (err) {
    console.error("[uploadSlideImage] Error:", err);
    res.status(500).json({ message: "Failed to upload slide image" });
  }
};

// POST test settings - test API connections for a category
exports.testSettings = async (req, res) => {
  try {
    const { category } = req.body;
    const settings = await SystemSetting.findOne({});
    const results = [];

    if (category === "Payments & Billing") {
      // Test Stripe
      if (settings?.stripeSecretKey) {
        try {
          const stripe = require("stripe")(settings.stripeSecretKey);
          await stripe.balance.retrieve();
          results.push({ name: "Stripe", success: true });
        } catch (err) {
          results.push({ name: "Stripe", success: false, error: err.message });
        }
      } else {
        results.push({ name: "Stripe", success: false, error: "Not configured" });
      }

      // Test CoinPayments
      if (settings?.coinPaymentsPublicKey && settings?.coinPaymentsPrivateKey) {
        results.push({ name: "CoinPayments", success: true, note: "Configured (manual verification recommended)" });
      } else {
        results.push({ name: "CoinPayments", success: false, error: "Not configured" });
      }

      // Test Heleket
      if (settings?.heleketMerchantId && settings?.heleketPaymentApiUrl) {
        try {
          const axios = require("axios");
          await axios.get(settings.heleketPaymentApiUrl, { timeout: 5000 });
          results.push({ name: "Heleket", success: true });
        } catch (err) {
          results.push({ name: "Heleket", success: false, error: err.message });
        }
      } else {
        results.push({ name: "Heleket", success: false, error: "Not configured" });
      }
    }

    if (category === "Authentication") {
      // Test Google OAuth
      if (settings?.googleClientId && settings?.googleClientSecret) {
        results.push({ name: "Google OAuth", success: true, note: "Configured (test with actual login)" });
      } else {
        results.push({ name: "Google OAuth", success: false, error: "Not configured" });
      }

      // Test LinkedIn OAuth
      if (settings?.linkedinClientId && settings?.linkedinClientSecret) {
        results.push({ name: "LinkedIn OAuth", success: true, note: "Configured (test with actual login)" });
      } else {
        results.push({ name: "LinkedIn OAuth", success: false, error: "Not configured" });
      }
    }

    if (category === "Infrastructure") {
      // Test SMTP
      if (settings?.smtpHost && settings?.smtpUser && settings?.smtpPass) {
        try {
          const nodemailer = require("nodemailer");
          const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            secure: settings.smtpSecure || false,
            auth: { user: settings.smtpUser, pass: settings.smtpPass },
          });
          await transporter.verify();
          results.push({ name: "SMTP", success: true });
        } catch (err) {
          results.push({ name: "SMTP", success: false, error: err.message });
        }
      } else {
        results.push({ name: "SMTP", success: false, error: "Not configured" });
      }

      // Test Debounce API
      if (settings?.debounceApi) {
        try {
          const axios = require("axios");
          await axios.get(`https://api.debounce.io/v1/?api=${settings.debounceApi}`, { timeout: 5000 });
          results.push({ name: "Debounce API", success: true });
        } catch (err) {
          results.push({ name: "Debounce API", success: false, error: err.response?.data?.error || err.message });
        }
      } else {
        results.push({ name: "Debounce API", success: false, error: "Not configured" });
      }

      // Test Telegram Bot
      if (settings?.telegramBotToken) {
        try {
          const axios = require("axios");
          await axios.get(`https://api.telegram.org/bot${settings.telegramBotToken}/getMe`, { timeout: 5000 });
          results.push({ name: "Telegram Bot", success: true });
        } catch (err) {
          results.push({ name: "Telegram Bot", success: false, error: err.message });
        }
      } else {
        results.push({ name: "Telegram Bot", success: false, error: "Not configured" });
      }
    }

    if (category === "UI & Branding") {
      results.push({ name: "UI Settings", success: true, note: "No API to test" });
    }

    res.json({ category, results });
  } catch (err) {
    console.error("[testSettings] Error:", err);
    res.status(500).json({ message: "Failed to test settings", error: err.message });
  }
};

// Send test email
exports.sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const settings = await SystemSetting.findOne({});
    
    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass || !settings?.smtpFrom) {
      return res.status(400).json({ message: "SMTP settings not configured" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: settings.smtpSecure || false,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });

    await transporter.verify();
    
    const mailOptions = {
      from: settings.smtpFrom,
      to: email,
      subject: "SMTP Test Email",
      text: "This is a test email to verify your SMTP configuration is working correctly.",
      html: "<p>This is a test email to verify your SMTP configuration is working correctly.</p>",
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Test email sent successfully" });
  } catch (err) {
    console.error("[sendTestEmail] Error:", err);
    res.status(500).json({ message: "Failed to send test email", error: err.message });
  }
};

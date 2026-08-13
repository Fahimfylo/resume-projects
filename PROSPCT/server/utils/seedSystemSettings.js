const mongoose = require("mongoose");
const SystemSetting = require("../models/SystemSetting");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(async () => {

    let settings = await SystemSetting.findOne({});
    if (settings) {
    } else {
      settings = new SystemSetting({
        stripeSecretKey: "",
        stripePublishableKey: "",
        stripeWebhookSecret: "",
        coinPaymentsPublicKey: "",
        coinPaymentsPrivateKey: "",
        googleClientId: "",
        googleClientSecret: "",
        linkedinClientId: "",
        linkedinClientSecret: "",
        debounceApi: "",
        telegramBotUsername: "",
        telegramBotToken: "",
        maintenanceMode: false,
        payProGlobalEncryptionKey: "",
        payProGlobalIV: "",
        heleketMerchantId: "",
        heleketPaymentApiUrl: "",
        smtpHost: process.env.SMTP_HOST || "",
        smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
        smtpSecure: process.env.SMTP_SECURE === "true",
        smtpUser: process.env.SMTP_USER || "",
        smtpPass: process.env.SMTP_PASS || "",
        smtpFrom:
          process.env.SMTP_FROM ||
          (process.env.SMTP_USER ? `"Prospct" <${process.env.SMTP_USER}>` : ""),
        loginHeroStat: "200,00+",
        loginSwiperSlides: [],
      });
      await settings.save();
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

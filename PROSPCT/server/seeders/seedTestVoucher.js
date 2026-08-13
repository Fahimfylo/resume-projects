const mongoose = require("mongoose");
const SpecialDeal = require("../models/SpecialDeal");
const Voucher = require("../models/Voucher");
const connectDB = require("../config/db");

async function seed() {
  try {
    await connectDB();

    const deals = await SpecialDeal.find({ isActive: true, maxRedeems: { $gt: 0 } }).lean();
    if (deals.length === 0) {
      console.log("No active special deals found. Create some in /admin/special-deals first.");
      process.exit(1);
    }

    console.log("Available deals:\n");
    deals.forEach((d, i) => console.log("  " + (i + 1) + ". " + d.code + " — " + d.emailCredits.toLocaleString() + " Email / " + d.phoneCredits.toLocaleString() + " Phone / " + d.verificationCredits.toLocaleString() + " Verification"));
    console.log("");

    const toCreate = deals.slice(0, 3);
    for (const deal of toCreate) {
      const code = "TEST-" + deal.code + "-" + Date.now().toString(36).toUpperCase();
      const existing = await Voucher.findOne({ voucherCode: code });
      if (!existing) {
        await Voucher.create({
          voucherCode: code,
          invoiceNumber: "seed-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
          payload: { plan: { codes: deal.codes }, pricing: { amount: deal.priceUSD } },
        });
        console.log("Created: " + code);
      }
    }

    const vouchers = await Voucher.find({ voucherCode: /^TEST-/ }).sort({ createdAt: -1 }).limit(3).lean();
    console.log("\n--- Redeem URLs ---");
    vouchers.forEach(v => console.log("https://app.prospct.io/redeem?code=" + v.voucherCode));
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();

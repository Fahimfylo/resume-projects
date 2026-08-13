const mongoose = require("mongoose");
const crypto = require("crypto");
const Voucher = require("../models/Voucher");
const ActivePackage = require("../models/ActivePackage");
const SpecialDeal = require("../models/SpecialDeal");
const connectDB = require("../config/db");

async function resolveDeal(voucher) {
  const planCodes = voucher.payload?.plan?.codes || voucher.payload?.plan_codes;
  if (planCodes) {
    const deal = await SpecialDeal.findOne({ codes: planCodes, isActive: true }).lean();
    if (deal) return deal;
  }
  const prefix = (voucher.voucherCode || "").split("-")[0];
  if (prefix) {
    const deal = await SpecialDeal.findOne({ code: prefix, isActive: true }).lean();
    if (deal) return deal;
  }
  return null;
}

async function migrate() {
  try {
    await connectDB();

    console.log("Fetching all redeemed vouchers...");
    const vouchers = await Voucher.find({ redeemedBy: { $ne: null } }).lean();
    console.log(`Found ${vouchers.length} redeemed vouchers.`);

    let createdCount = 0;
    let skippedCount = 0;
    let tokenBackfillCount = 0;

    for (const voucher of vouchers) {
      // Backfill redeemToken if missing
      if (!voucher.redeemToken) {
        await Voucher.findByIdAndUpdate(voucher._id, { redeemToken: crypto.randomUUID() });
        tokenBackfillCount++;
      }

      // Check if ActivePackage already exists for this voucher
      const existing = await ActivePackage.findOne({ voucher: voucher._id });
      if (existing) {
        skippedCount++;
        continue;
      }

      const deal = await resolveDeal(voucher);
      if (!deal) {
        console.warn(`  Skipping voucher ${voucher.voucherCode} — could not resolve deal.`);
        skippedCount++;
        continue;
      }

      const quantity = voucher.quantity || deal.codes || 1;
      const perRedeemCredits = {
        emailCredits: Math.floor((deal.emailCredits || 0) / quantity),
        phoneCredits: Math.floor((deal.phoneCredits || 0) / quantity),
        verificationCredits: Math.floor((deal.verificationCredits || 0) / quantity),
        exportCredits: Math.floor((deal.exportCredits || 0) / quantity),
        emailSeats: Math.floor((deal.emailSeats || 0) / quantity),
      };

      const activatedAt = voucher.redeemedAt || voucher.createdAt;
      const oneMonthLater = new Date(activatedAt);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      const nextRenewalAt = oneMonthLater < new Date() ? new Date() : oneMonthLater;

      await ActivePackage.create({
        user: voucher.redeemedBy,
        voucher: voucher._id,
        deal: deal._id,
        activatedAt,
        nextRenewalAt,
        lastRenewedAt: null,
        renewalPeriod: 0,
        creditsPerRenewal: perRedeemCredits,
        status: "active",
      });
      createdCount++;
    }

    console.log(`\nMigration complete:`);
    console.log(`  ActivePackages created: ${createdCount}`);
    console.log(`  Skipped (no deal / already exists): ${skippedCount}`);
    console.log(`  RedeemTokens backfilled: ${tokenBackfillCount}`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

migrate();

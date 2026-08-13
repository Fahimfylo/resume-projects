const cron = require("node-cron");
const ActivePackage = require("../models/ActivePackage");
const User = require("../models/User");
const CreditLedger = require("../models/CreditLedger");
const VoucherRedemptionLog = require("../models/VoucherRedemptionLog");

function grantRenewalCredits(userId, credits) {
  const increments = {};
  const { emailCredits = 0, phoneCredits = 0, verificationCredits = 0, exportCredits = 0 } = credits;
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

  return User.findByIdAndUpdate(userId, { $inc: increments }, { new: true });
}

async function logRenewalInLedger(userId, pkg, credits) {
  const { emailCredits = 0, phoneCredits = 0, verificationCredits = 0, exportCredits = 0 } = credits;
  const maxCredits = Math.max(emailCredits, phoneCredits, verificationCredits, exportCredits);
  const entries = [];

  if (maxCredits > 0) {
    entries.push({
      userId,
      creditType: "EMAIL",
      transactionType: "FREE_REFILL",
      amount: emailCredits || maxCredits,
      balanceAfter: emailCredits || maxCredits,
      referenceId: `renewal-${pkg._id}-period-${pkg.renewalPeriod + 1}`,
      metadata: { activePackageId: pkg._id.toString(), renewalPeriod: pkg.renewalPeriod + 1 },
    });
    entries.push({
      userId,
      creditType: "PHONE",
      transactionType: "FREE_REFILL",
      amount: phoneCredits || maxCredits,
      balanceAfter: phoneCredits || maxCredits,
      referenceId: `renewal-${pkg._id}-period-${pkg.renewalPeriod + 1}`,
      metadata: { activePackageId: pkg._id.toString(), renewalPeriod: pkg.renewalPeriod + 1 },
    });
    entries.push({
      userId,
      creditType: "VERIFICATION",
      transactionType: "FREE_REFILL",
      amount: verificationCredits || maxCredits,
      balanceAfter: verificationCredits || maxCredits,
      referenceId: `renewal-${pkg._id}-period-${pkg.renewalPeriod + 1}`,
      metadata: { activePackageId: pkg._id.toString(), renewalPeriod: pkg.renewalPeriod + 1 },
    });
    entries.push({
      userId,
      creditType: "EXPORT",
      transactionType: "FREE_REFILL",
      amount: exportCredits || maxCredits,
      balanceAfter: exportCredits || maxCredits,
      referenceId: `renewal-${pkg._id}-period-${pkg.renewalPeriod + 1}`,
      metadata: { activePackageId: pkg._id.toString(), renewalPeriod: pkg.renewalPeriod + 1 },
    });
  }

  if (entries.length > 0) {
    await CreditLedger.insertMany(entries);
  }
}

async function processRenewals() {
  const now = new Date();
  console.log(`[AUTO-RENEWAL] Checking for packages due for renewal at ${now.toISOString()}`);

  try {
    const packages = await ActivePackage.find({
      status: "active",
      nextRenewalAt: { $lte: now },
    }).lean();

    if (packages.length === 0) {
      console.log("[AUTO-RENEWAL] No packages due for renewal.");
      return;
    }

    console.log(`[AUTO-RENEWAL] Found ${packages.length} package(s) to renew.`);

    for (const pkg of packages) {
      try {
        const user = await User.findById(pkg.user);
        if (!user) {
          console.error(`[AUTO-RENEWAL] User ${pkg.user} not found for package ${pkg._id}. Skipping.`);
          continue;
        }

        await grantRenewalCredits(pkg.user, pkg.creditsPerRenewal);
        await logRenewalInLedger(pkg.user, pkg, pkg.creditsPerRenewal);

        const nextPeriod = (pkg.renewalPeriod || 0) + 1;
        const nextRenewal = new Date(pkg.activatedAt);
        nextRenewal.setMonth(nextRenewal.getMonth() + nextPeriod);

        await ActivePackage.findByIdAndUpdate(pkg._id, {
          lastRenewedAt: now,
          nextRenewalAt: nextRenewal,
          $inc: { renewalPeriod: 1 },
        });

        await VoucherRedemptionLog.create({
          voucherCode: pkg.voucher ? String(pkg.voucher) : "",
          voucherId: pkg.voucher,
          userId: pkg.user,
          status: "success",
          source: "auto-renewal",
          credits: pkg.creditsPerRenewal,
        });

        console.log(`[AUTO-RENEWAL] Package ${pkg._id} renewed. Next: ${nextRenewal.toISOString()}`);
      } catch (pkgErr) {
        console.error(`[AUTO-RENEWAL] Failed to renew package ${pkg._id}:`, pkgErr.message);

        await VoucherRedemptionLog.create({
          voucherCode: pkg.voucher ? String(pkg.voucher) : "",
          voucherId: pkg.voucher,
          userId: pkg.user,
          status: "failed",
          source: "auto-renewal",
          errorMessage: pkgErr.message,
        });
      }
    }
  } catch (err) {
    console.error("[AUTO-RENEWAL] Error processing renewals:", err);
  }
}

function startAutoRenewal() {
  cron.schedule("0 */6 * * *", () => {
    processRenewals();
  });

  console.log("[AUTO-RENEWAL] Cron job scheduled (every 6 hours).");
}

module.exports = { startAutoRenewal, processRenewals };

/**
 * Migration Script: Seed the 10 predefined Special Deal packages
 *
 * Creates 10 special deal packages (tiers 1-10) with pricing in USD/BDT,
 * contact credits, verification credits, and email seats.
 *
 * Safe to re-run — skips existing deals by default.
 * Use FORCE=true to delete and re-seed:  node server/scripts/migrateSpecialDeals.js
 *
 * Usage: node server/scripts/migrateSpecialDeals.js
 */

const path = require("path");
const mongoose = require("mongoose");
const SpecialDeal = require("../models/SpecialDeal");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const DEAL_PACKAGES = [
  { codes: 1,  discount: "-97%", priceUSD: 49,  originalPriceUSD: 1740,  priceBDT: 4900,  contacts: 5000,  verifications: 5000,  emailSeats: 0 },
  { codes: 2,  discount: "-97%", priceUSD: 98,  originalPriceUSD: 3480,  priceBDT: 9800,  contacts: 10000, verifications: 10000, emailSeats: 0 },
  { codes: 3,  discount: "-97%", priceUSD: 147, originalPriceUSD: 5220,  priceBDT: 14700, contacts: 15000, verifications: 15000, emailSeats: 1 },
  { codes: 4,  discount: "-97%", priceUSD: 196, originalPriceUSD: 6960,  priceBDT: 19600, contacts: 20000, verifications: 20000, emailSeats: 1 },
  { codes: 5,  discount: "-97%", priceUSD: 245, originalPriceUSD: 8700,  priceBDT: 24500, contacts: 25000, verifications: 25000, emailSeats: 1 },
  { codes: 6,  discount: "-97%", priceUSD: 294, originalPriceUSD: 10440, priceBDT: 29400, contacts: 30000, verifications: 30000, emailSeats: 2 },
  { codes: 7,  discount: "-97%", priceUSD: 343, originalPriceUSD: 12180, priceBDT: 34300, contacts: 35000, verifications: 35000, emailSeats: 2 },
  { codes: 8,  discount: "-97%", priceUSD: 392, originalPriceUSD: 13920, priceBDT: 39200, contacts: 40000, verifications: 40000, emailSeats: 2 },
  { codes: 9,  discount: "-97%", priceUSD: 441, originalPriceUSD: 15660, priceBDT: 44100, contacts: 45000, verifications: 45000, emailSeats: 2 },
  { codes: 10, discount: "-97%", priceUSD: 490, originalPriceUSD: 17400, priceBDT: 49000, contacts: 50000, verifications: 50000, emailSeats: 2 },
];

async function migrateSpecialDeals() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    if (process.env.FORCE === "true") {
      await SpecialDeal.deleteMany({});
    } else {
      const existing = await SpecialDeal.countDocuments();
      if (existing > 0) {
        console.log(`Found ${existing} existing deals — skipping. Set FORCE=true to re-seed.`);
        console.log("Done.");
        return;
      }
    }

    const docs = DEAL_PACKAGES.map((p) => ({
      code: `DEAL${p.codes}K`,
      description: `${p.codes} ${p.codes === 1 ? "Code" : "Codes"} — ${(p.contacts / 1000).toFixed(0)}K Contacts + ${(p.verifications / 1000).toFixed(0)}K Verifications`,
      codes: p.codes,
      discount: p.discount,
      priceUSD: p.priceUSD,
      originalPriceUSD: p.originalPriceUSD,
      priceBDT: p.priceBDT,
      emailCredits: p.contacts,
      verificationCredits: p.verifications,
      emailSeats: p.emailSeats,
      isActive: true,
      maxRedeems: 1,
      timesRedeemed: 0,
    }));

    await SpecialDeal.insertMany(docs);
    console.log(`Migrated ${docs.length} special deal packages.`);
    docs.forEach((d) =>
      console.log(`  ${d.code}  →  $${d.priceUSD}  (${d.emailCredits.toLocaleString()} contacts + ${d.verificationCredits.toLocaleString()} verifications)`)
    );
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

migrateSpecialDeals();

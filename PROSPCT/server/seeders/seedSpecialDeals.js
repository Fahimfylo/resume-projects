const mongoose = require("mongoose");
const SpecialDeal = require("../models/SpecialDeal");
const connectDB = require("../config/db");

const deals = [
  { codes: 1, discount: "-97%", priceUSD: 49,  originalPriceUSD: 1740,  priceBDT: 4900,  emailCredits: 5000,  verificationCredits: 5000,  emailSeats: 0 },
  { codes: 2, discount: "-97%", priceUSD: 98,  originalPriceUSD: 3480,  priceBDT: 9800,  emailCredits: 10000, verificationCredits: 10000, emailSeats: 0 },
  { codes: 3, discount: "-97%", priceUSD: 147, originalPriceUSD: 5220,  priceBDT: 14700, emailCredits: 15000, verificationCredits: 15000, emailSeats: 1 },
  { codes: 4, discount: "-97%", priceUSD: 196, originalPriceUSD: 6960,  priceBDT: 19600, emailCredits: 20000, verificationCredits: 20000, emailSeats: 1 },
  { codes: 5, discount: "-97%", priceUSD: 245, originalPriceUSD: 8700,  priceBDT: 24500, emailCredits: 25000, verificationCredits: 25000, emailSeats: 1 },
  { codes: 6, discount: "-97%", priceUSD: 294, originalPriceUSD: 10440, priceBDT: 29400, emailCredits: 30000, verificationCredits: 30000, emailSeats: 2 },
  { codes: 7, discount: "-97%", priceUSD: 343, originalPriceUSD: 12180, priceBDT: 34300, emailCredits: 35000, verificationCredits: 35000, emailSeats: 2 },
  { codes: 8, discount: "-97%", priceUSD: 392, originalPriceUSD: 13920, priceBDT: 39200, emailCredits: 40000, verificationCredits: 40000, emailSeats: 2 },
  { codes: 9, discount: "-97%", priceUSD: 441, originalPriceUSD: 15660, priceBDT: 44100, emailCredits: 45000, verificationCredits: 45000, emailSeats: 2 },
  { codes: 10, discount: "-97%", priceUSD: 490, originalPriceUSD: 17400, priceBDT: 49000, emailCredits: 50000, verificationCredits: 50000, emailSeats: 2 },
];

async function seed() {
  try {
    await connectDB();

    const existing = await SpecialDeal.countDocuments();
    if (existing > 0) {
      console.log(`Found ${existing} existing special deals. Deleting and re-seeding...`);
      await SpecialDeal.deleteMany({});
    }

    const docs = deals.map((d, i) => ({
      code: `DEAL${d.codes}K`,
      description: `${d.codes} ${d.codes === 1 ? "Code" : "Codes"} — ${(d.emailCredits / 1000).toFixed(0)}K Contacts + ${(d.verificationCredits / 1000).toFixed(0)}K Verifications`,
      ...d,
      isActive: true,
      maxRedeems: 1,
      timesRedeemed: 0,
    }));

    await SpecialDeal.insertMany(docs);
    console.log(`Seeded ${docs.length} special deals successfully!`);
    console.log("Codes created:");
    docs.forEach((d) => console.log(`  ${d.code}  →  $${d.priceUSD}  |  ${d.emailCredits.toLocaleString()} contacts + ${d.verificationCredits.toLocaleString()} verifications`));
  } catch (err) {
    console.error("Seed failed:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();

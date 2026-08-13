require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const os = require("os");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const status = await db.admin().serverStatus();

  console.log("═══════════════════════════════════════════════════════");
  console.log("  VPS RAM & SYSTEM");
  console.log("═══════════════════════════════════════════════════════");

  // hostInfo has system info from MongoDB
  const hi = status.hostInfo || {};
  const sys = hi.system || {};
  console.log("  OS:", sys.os || "unknown");
  console.log("  Architecture:", sys.arch || "unknown");
  console.log("  CPU Model:", hi.cpu || "unknown");

  // extra_info
  const ei = status.extra_info || {};
  console.log("  physical_memory (serverStatus):", ei.physical_memory || "not reported");

  // WiredTiger cache max = ~50% of RAM by default
  const wt = status.wiredTiger?.cache || {};
  const cacheMax = wt["maximum bytes configured"] || 0;
  const cacheMaxGB = (cacheMax / 1024 / 1024 / 1024).toFixed(1);
  console.log("  WT Cache Max:", cacheMaxGB + "GB");
  console.log("  → Estimated total RAM: ~" + (cacheMaxGB * 2).toFixed(0) + "GB (WT default = 50%)");

  // Process memory
  const proc = status.process || {};
  console.log("  MongoDB Resident Memory:", Math.round((proc.residentSize || 0) / 1024 / 1024) + "MB");
  console.log("  MongoDB Virtual Memory:", Math.round((proc.virtualSize || 0) / 1024 / 1024) + "MB");

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  CONNECTIONS");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Current:", status.connections?.current);
  console.log("  Available:", status.connections?.available);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  INDEX SIZE SUMMARY");
  console.log("═══════════════════════════════════════════════════════");

  const collections = await db.listCollections().toArray();
  let totalIndexSize = 0;
  let totalDataSize = 0;
  let totalIndexes = 0;
  const rows = [];

  for (const col of collections) {
    const stats = await db.command({ collStats: col.name, scale: 1024 * 1024 });
    if (!stats.count || stats.count === 0) continue;
    const idxMB = Math.round(stats.totalIndexSize || 0);
    const dataMB = Math.round(stats.size || 0);
    totalIndexSize += idxMB;
    totalDataSize += dataMB;
    const indexes = await db.collection(col.name).indexes();
    const idxCount = indexes.length;
    totalIndexes += idxCount;
    rows.push({ name: col.name, docs: stats.count, dataMB, idxMB, idxCount });
  }

  rows.sort((a, b) => b.dataMB - a.dataMB);

  for (const r of rows) {
    const ratio = r.dataMB > 0 ? ((r.idxMB / r.dataMB) * 100).toFixed(1) + "%" : "—";
    console.log("  " + r.name.padEnd(28) + "Docs:" + String(r.docs).padStart(12) + "  Data:" + String(r.dataMB + "MB").padStart(10) + "  Index:" + String(r.idxMB + "MB").padStart(10) + "  Ratio:" + ratio.padStart(7) + "  (#" + r.idxCount + ")");
  }

  console.log("  " + "─".repeat(100));
  console.log("  " + "TOTAL".padEnd(28) + " ".repeat(12) + "  Data:" + String(totalDataSize + "MB").padStart(10) + "  Index:" + String(totalIndexSize + "MB").padStart(10) + "  Total indexes: " + totalIndexes);
  console.log("  " + " ".repeat(28) + " ".repeat(12) + "  Data:" + String((totalDataSize / 1024).toFixed(1) + "GB").padStart(10) + "  Index:" + String((totalIndexSize / 1024).toFixed(1) + "GB").padStart(10));

  // Check which of our 21 dropped indexes still exist (auto-recreated by Mongoose)
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  DROPPED INDEXES STILL PRESENT (auto-recreated by Mongoose)");
  console.log("═══════════════════════════════════════════════════════");

  const DROPPED = [
    { coll: "accounts", idx: "email_1_role_1" },
    { coll: "accounts", idx: "role_1" },
    { coll: "accounts", idx: "createdAt_-1" },
    { coll: "accounts", idx: "createdAt_1" },
    { coll: "members", idx: "team_1" },
    { coll: "members", idx: "owner_1" },
    { coll: "members", idx: "team_1_email_1" },
    { coll: "contacts_imported", idx: "importBatchId_1" },
    { coll: "contacts_imported", idx: "adminId_1" },
    { coll: "contacts_imported", idx: "email_1" },
    { coll: "contacts_imported", idx: "status_1" },
    { coll: "contacts_imported", idx: "processedToContactsV5_1" },
    { coll: "contacts_imported", idx: "importBatchId_1_status_1" },
    { coll: "contacts_imported", idx: "createdAt_-1" },
    { coll: "import_batches", idx: "adminId_1" },
    { coll: "import_batches", idx: "status_1" },
    { coll: "import_batches", idx: "createdAt_-1" },
    { coll: "import_batches", idx: "adminId_1_createdAt_-1" },
    { coll: "users", idx: "teamId_1" },
    { coll: "users", idx: "invitedBy_1" },
    { coll: "savedcontacts", idx: "contactId_1" },
  ];

  let stillPresent = 0;
  let trulyGone = 0;
  for (const { coll, idx } of DROPPED) {
    try {
      const exists = await db.collection(coll).indexExists(idx);
      if (exists) {
        console.log("  STILL EXISTS: " + coll + "." + idx);
        stillPresent++;
      } else {
        trulyGone++;
      }
    } catch (e) {
      console.log("  ERROR checking " + coll + "." + idx + ": " + e.message);
    }
  }
  console.log("\n  Truly gone: " + trulyGone + "/21");
  console.log("  Auto-recreated: " + stillPresent + "/21");

  await mongoose.disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });

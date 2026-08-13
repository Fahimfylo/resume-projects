require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  // 1. Server status (RAM, CPU, OS)
  console.log("═══════════════════════════════════════════════════════");
  console.log("  VPS / SERVER INFO");
  console.log("═══════════════════════════════════════════════════════");
  const status = await db.admin().serverStatus();
  const memGB = Math.round((status.extra_info?.physical_memory || 0) / 1024 / 1024 / 1024);
  console.log("  MongoDB Version:", status.version);
  console.log("  Host:", status.host);
  console.log("  OS:", status.os?.type, status.os?.architecture);
  console.log("  RAM Total:", memGB + "GB");
  console.log("  Uptime:", Math.round(status.uptime / 86400) + " days");
  console.log("  Node.js:", status.process?.version || "unknown");

  // 2. WiredTiger cache (RAM usage)
  const wt = status.wiredTiger?.cache || {};
  const cacheMaxMB = Math.round((wt["maximum bytes configured"] || 0) / 1024 / 1024);
  const cacheUsedMB = Math.round((wt["bytes currently in the cache"] || 0) / 1024 / 1024);
  const cacheDirtyMB = Math.round((wt["tracked dirty bytes in the cache"] || 0) / 1024 / 1024);
  console.log("\n  WiredTiger Cache Max:", cacheMaxMB + "MB");
  console.log("  WiredTiger Cache Used:", cacheUsedMB + "MB");
  console.log("  WiredTiger Dirty:", cacheDirtyMB + "MB");

  // 3. Connection pool
  console.log("  Current Connections:", status.connections?.current || 0);
  console.log("  Available Connections:", status.connections?.available || 0);

  // 4. All collection stats with index sizes
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  COLLECTION SIZES (after drop)");
  console.log("═══════════════════════════════════════════════════════");
  const collections = await db.listCollections().toArray();
  let totalIndexSize = 0;
  let totalDataSize = 0;

  const rows = [];
  for (const col of collections) {
    const stats = await db.command({ collStats: col.name, scale: 1024 * 1024 });
    if (!stats.count || stats.count === 0) continue;
    const idxMB = Math.round(stats.totalIndexSize || 0);
    const dataMB = Math.round(stats.size || 0);
    const docs = stats.count || 0;
    totalIndexSize += idxMB;
    totalDataSize += dataMB;
    rows.push({ name: col.name, docs, dataMB, idxMB, indexes: stats.indexes });
  }

  // Sort by data size descending
  rows.sort((a, b) => b.dataMB - a.dataMB);
  for (const r of rows) {
    console.log("  " + r.name.padEnd(28) + "Docs: " + String(r.docs).padStart(12) + "  Data: " + String(r.dataMB + "MB").padStart(10) + "  Index: " + String(r.idxMB + "MB").padStart(10) + "  (#" + r.indexes + ")");
  }
  console.log("  " + "─".repeat(90));
  console.log("  " + "TOTAL".padEnd(28) + " ".repeat(12) + " Data: " + String(totalDataSize + "MB").padStart(10) + "  Index: " + String(totalIndexSize + "MB").padStart(10));

  // 5. List all indexes per collection
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  ALL EXISTING INDEXES");
  console.log("═══════════════════════════════════════════════════════");
  for (const col of collections) {
    const indexes = await db.collection(col.name).indexes();
    if (indexes.length <= 1) continue;
    console.log("\n  [" + col.name + "] (" + (indexes.length - 1) + " non-_id indexes)");
    for (const idx of indexes) {
      if (idx.name === "_id_") continue;
      const keys = JSON.stringify(idx.key);
      const opts = [];
      if (idx.unique) opts.push("unique");
      if (idx.sparse) opts.push("sparse");
      if (idx.expireAfterSeconds) opts.push("TTL:" + idx.expireAfterSeconds + "s");
      if (idx.partialFilterExpression) opts.push("partial");
      console.log("    " + idx.name.padEnd(55) + keys + (opts.length ? " [" + opts.join(", ") + "]" : ""));
    }
  }

  await mongoose.disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });

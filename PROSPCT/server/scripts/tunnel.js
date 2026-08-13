const localtunnel = require("localtunnel");

(async () => {
  const tunnel = await localtunnel({ port: 4000, subdomain: "prospctvoucher" });
  console.log("\n========================================");
  console.log("  VOUCHER API TUNNEL ACTIVE");
  console.log("========================================");
  console.log(`  Public URL: ${tunnel.url}`);
  console.log(`  Endpoint:   ${tunnel.url}/admin/special-deals/requests`);
  console.log("========================================");
  console.log("  Give this to Lovable:");
  console.log(`  /thank-you?apiUrl=${tunnel.url}/admin/special-deals/requests`);
  console.log("========================================\n");

  tunnel.on("close", () => {
    console.log("Tunnel closed");
    process.exit(0);
  });
})().catch((err) => {
  console.error("Tunnel failed:", err.message);
  process.exit(1);
});

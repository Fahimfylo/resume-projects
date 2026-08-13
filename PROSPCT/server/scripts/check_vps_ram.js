const { Client } = require("ssh2");

const HOST = "109.199.103.178";
const USER = "root";
const PASS = "nEwRoo7t";

function execCmd(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) { reject(err); return; }
      let out = "";
      stream.on("data", (d) => (out += d));
      stream.on("close", () => resolve(out.trim()));
      stream.stderr.on("data", (d) => (out += d));
    });
  });
}

async function main() {
  const conn = new Client();
  conn.on("ready", async () => {
    try {
      console.log("=== Memory Info ===\n");
      console.log(await execCmd(conn, "free -h"));
      console.log("\n=== Top memory consumers ===\n");
      console.log(await execCmd(conn, "ps aux --sort=-%mem | head -10"));
      conn.end();
    } catch (err) {
      console.error("Error:", err.message);
      conn.end();
    }
  }).on("error", (e) => {
    console.error("SSH error:", e.message);
    process.exit(1);
  }).connect({ host: HOST, username: USER, password: PASS, readyTimeout: 30000 });
}

main();

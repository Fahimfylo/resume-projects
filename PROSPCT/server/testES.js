const esClient = require("./config/elasticsearch");

async function test() {
  try {
    const info = await esClient.info();
    console.log('✅ Connected to Elasticsearch, full response:', info);
    console.log('info.body:', info.body);
    console.log('info.statusCode:', info.statusCode);
    console.log('info.headers:', info.headers);

  } catch (err) {
    console.error("❌ Elasticsearch connection failed:", err);
  }
}

test();

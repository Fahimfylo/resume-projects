const { Client } = require("@elastic/elasticsearch");

const esClient = new Client({
  node: process.env.ES_HOST || "https://127.0.0.1:9200",

  auth: {
    username: process.env.ES_USER || "elastic",
    password: process.env.ES_PASS || "4kR9vM2nXq8wP7tL5jH3sA1fB6cY0eD",
  },

  tls: {
    rejectUnauthorized: process.env.ES_TLS_REJECT_UNAUTHORIZED === "true",
  },

  sniffOnStart: false,
  sniffOnConnectionFault: false,
  maxRetries: parseInt(process.env.ES_MAX_RETRIES || "5", 10),
  requestTimeout: parseInt(process.env.ES_REQUEST_TIMEOUT || "60000", 10),
});

module.exports = esClient;

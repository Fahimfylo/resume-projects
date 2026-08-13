const express = require("express");

/**
 * Middleware to capture raw body for webhook signature validation
 * Must be used BEFORE express.json() middleware
 */
const rawBodyMiddleware = express.raw({
  type: "application/json",
  limit: "10mb",
  verify: (req, res, buf, encoding) => {
    // Store the raw body string for webhook signature validation
    req.rawBody = buf.toString(encoding || "utf8");
  },
});

/**
 * Middleware to parse body after capturing raw body
 */
const parseJsonMiddleware = express.json({
  limit: "10mb",
});

module.exports = {
  rawBodyMiddleware,
  parseJsonMiddleware,
};

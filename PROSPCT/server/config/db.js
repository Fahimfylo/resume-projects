require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 300000,
      maxPoolSize: 50,
      minPoolSize: 5,
    });
  } catch (err) {
    // Connection failed — server keeps running
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;

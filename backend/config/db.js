// ============================================================
// config/db.js — MongoDB Atlas Connection
// Uses Mongoose to connect. Retries are handled by Mongoose 8+
// ============================================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are defaults in Mongoose 8 but listed for clarity
      serverSelectionTimeoutMS: 5000,  // Fail fast if Atlas unreachable
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
  console.error(`❌ MongoDB connection error: ${error.message}`);
  console.log("Retrying MongoDB connection in 5 seconds...");

  setTimeout(connectDB, 5000);
}
};

module.exports = connectDB;

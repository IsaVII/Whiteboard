const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/whiteboard";

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
      appName: "whiteboard-app",
    });
    console.log(`[db] connected to MongoDB at ${uri}`);
  } catch (err) {
    console.error("[db] connection error:", err.message);
    console.error("[db] error details:", err.code);
    // Retry after a short delay instead of crashing immediately
    setTimeout(connectDB, 5000);
  }
}

module.exports = connectDB;

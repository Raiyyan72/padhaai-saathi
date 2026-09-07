const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("Connecting MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB Connected");

  } catch (error) {
    console.error("❌ MongoDB Connection Failed:");
    console.error(error.message);

    throw error;
  }
};

module.exports = connectDB;
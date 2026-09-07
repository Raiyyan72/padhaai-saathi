const mongoose = require("mongoose");
require("dotenv").config();

(async () => {
  try {
    console.log("Mongo URI:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected Successfully!");
    process.exit(0);
  } catch (err) {
    console.log("❌ Error Name:", err.name);
    console.log("❌ Error Message:", err.message);
    console.log("❌ Full Error:");
    console.log(err);
    process.exit(1);
  }
})();
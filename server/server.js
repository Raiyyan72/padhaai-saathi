const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const libraryRoutes = require("./routes/libraryRoutes");
const progressRoutes = require("./routes/progressRoutes");


const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

// ==========================================
// ROUTES
// ==========================================

const settingsRoutes = require("./routes/settingsRoutes");

app.use("/api/settings", settingsRoutes);



app.use("/api/auth", authRoutes);

app.use("/api/chat", chatRoutes);

app.use("/api/library", libraryRoutes);

app.use("/api/progress", progressRoutes);


// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.send("🚀 Padhaai Saathi Backend Running");
});


// ==========================================
// SERVER START
// ==========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {

  try {

    await connectDB();

    app.listen(PORT, () => {

      console.log(
        `🚀 Server running on port ${PORT}`
      );

    });

  } catch (error) {

    console.error("❌ Server Error:", error);

  }

};

startServer();
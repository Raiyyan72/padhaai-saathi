const express = require("express");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authControllers");

const authMiddleware = require("../middleware/authMiddleware");



// ===============================
// Register
// ===============================

router.post("/register", register);



// ===============================
// Login
// ===============================

router.post("/login", login);



// ===============================
// Forgot Password
// ===============================

router.post("/forgot-password", forgotPassword);



// ===============================
// Reset Password
// ===============================

router.post("/reset-password", resetPassword);



// ===============================
// Protected Profile Route
// ===============================

router.get("/profile", authMiddleware, (req, res) => {

  res.json({
    message: "Profile Access Granted",
    user: req.user,
  });

});



module.exports = router;
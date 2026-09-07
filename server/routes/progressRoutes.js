const express = require("express");

const router = express.Router();

const {
  getProgress,
  updateProgress,
} = require("../controllers/progressController");

const authMiddleware = require("../middleware/authMiddleware");


// ==========================================
// GET PROGRESS
// ==========================================

router.get(
  "/",
  authMiddleware,
  getProgress
);


// ==========================================
// UPDATE PROGRESS
// ==========================================

router.patch(
  "/",
  authMiddleware,
  updateProgress
);


module.exports = router;



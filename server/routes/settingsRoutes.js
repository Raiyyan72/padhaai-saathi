const express = require("express");

const router = express.Router();

const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");

const authMiddleware = require("../middleware/authMiddleware");


// GET settings
router.get(
  "/",
  authMiddleware,
  getSettings
);


// UPDATE settings
router.put(
  "/",
  authMiddleware,
  updateSettings
);


module.exports = router;

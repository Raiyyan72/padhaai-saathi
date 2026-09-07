const express = require("express");

const router = express.Router();

const multer = require("multer");

const {
  sendMessage,
  getChatHistory,
  getChatStats,
  deleteChatHistory,
  deleteSingleChat,
} = require("../controllers/chatController");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// MULTER CONFIG
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

// ==========================================
// SEND MESSAGE + FILE
// ==========================================

router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  sendMessage
);

// ==========================================
// GET CHAT HISTORY
// ==========================================

router.get(
  "/history",
  authMiddleware,
  getChatHistory
);

// ==========================================
// GET CHAT STATS / PROGRESS
// ==========================================

router.get(
  "/stats",
  authMiddleware,
  getChatStats
);

// ==========================================
// DELETE ALL CHAT HISTORY
// ==========================================

router.delete(
  "/history",
  authMiddleware,
  deleteChatHistory
);

// ==========================================
// DELETE SINGLE CHAT
// ==========================================

router.delete(
  "/:id",
  authMiddleware,
  deleteSingleChat
);

module.exports = router;


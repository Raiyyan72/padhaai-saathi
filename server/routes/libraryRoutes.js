const express = require("express");

const router = express.Router();

const {
  saveToLibrary,
  getLibrary,
  deleteLibraryItem,
  clearLibrary,
} = require("../controllers/libraryController");

const authMiddleware = require("../middleware/authMiddleware");


// ==========================================
// SAVE TO LIBRARY
// ==========================================

router.post(
  "/",
  authMiddleware,
  saveToLibrary
);


// ==========================================
// GET MY LIBRARY
// ==========================================

router.get(
  "/",
  authMiddleware,
  getLibrary
);


// ==========================================
// DELETE ALL LIBRARY ITEMS
// ==========================================

router.delete(
  "/clear",
  authMiddleware,
  clearLibrary
);


// ==========================================
// DELETE SINGLE LIBRARY ITEM
// ==========================================

router.delete(
  "/:id",
  authMiddleware,
  deleteLibraryItem
);


module.exports = router;
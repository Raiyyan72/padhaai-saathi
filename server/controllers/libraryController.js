const Library = require("../models/Library");


// ==========================================
// SAVE TO LIBRARY
// ==========================================

const saveToLibrary = async (req, res) => {

  try {

    const { title, content, type } = req.body;

    if (!title || !content) {

      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });

    }

    const libraryItem = await Library.create({

      userId: req.user.id,

      title: title.trim(),

      content,

      type: type || "note",

    });

    res.status(201).json({

      success: true,

      message: "Saved to library successfully",

      item: libraryItem,

    });

  } catch (error) {

    console.error(
      "❌ Save Library Error:",
      error
    );

    res.status(500).json({

      success: false,

      message: "Unable to save to library",

    });

  }

};


// ==========================================
// GET MY LIBRARY
// ==========================================

const getLibrary = async (req, res) => {

  try {

    const library = await Library.find({

      userId: req.user.id,

    }).sort({

      createdAt: -1,

    });

    res.status(200).json({

      success: true,

      library,

    });

  } catch (error) {

    console.error(
      "❌ Library Fetch Error:",
      error
    );

    res.status(500).json({

      success: false,

      message: "Unable to fetch library",

    });

  }

};


// ==========================================
// DELETE SINGLE LIBRARY ITEM
// ==========================================

const deleteLibraryItem = async (req, res) => {

  try {

    const item = await Library.findOneAndDelete({

      _id: req.params.id,

      userId: req.user.id,

    });

    if (!item) {

      return res.status(404).json({

        success: false,

        message: "Library item not found",

      });

    }

    res.status(200).json({

      success: true,

      message: "Library item deleted successfully",

    });

  } catch (error) {

    console.error(
      "❌ Library Delete Error:",
      error
    );

    res.status(500).json({

      success: false,

      message: "Unable to delete library item",

    });

  }

};


// ==========================================
// DELETE COMPLETE LIBRARY
// ==========================================

const clearLibrary = async (req, res) => {

  try {

    await Library.deleteMany({

      userId: req.user.id,

    });

    res.status(200).json({

      success: true,

      message: "Library cleared successfully",

    });

  } catch (error) {

    console.error(
      "❌ Clear Library Error:",
      error
    );

    res.status(500).json({

      success: false,

      message: "Unable to clear library",

    });

  }

};


// ==========================================
// EXPORT
// ==========================================

module.exports = {

  saveToLibrary,

  getLibrary,

  deleteLibraryItem,

  clearLibrary,

};
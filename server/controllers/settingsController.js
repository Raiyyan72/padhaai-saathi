const Settings = require("../models/settings");

// ===============================
// GET SETTINGS
// ===============================

const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await Settings.findOne({ userId });

    // Agar user ki settings nahi hain
    // to default settings create karo
    if (!settings) {
      settings = await Settings.create({
        userId,
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error("❌ Get Settings Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load settings",
    });
  }
};


// ===============================
// UPDATE SETTINGS
// ===============================

const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      responseStyle,
      studyLevel,
      explanationMode,

      autoScroll,
      enterToSend,
      voiceInput,
      focusMode,
      studyReminder,
      smartSuggestions,
    } = req.body;


    const settings = await Settings.findOneAndUpdate(
      { userId },

      {
        responseStyle,
        studyLevel,
        explanationMode,

        autoScroll,
        enterToSend,
        voiceInput,
        focusMode,
        studyReminder,
        smartSuggestions,
      },

      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );


    res.status(200).json({
      success: true,
      message: "Settings saved successfully",
      settings,
    });

  } catch (error) {
    console.error("❌ Update Settings Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save settings",
      error: error.message,
    });
  }
};


module.exports = {
  getSettings,
  updateSettings,
};
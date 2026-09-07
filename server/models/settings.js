const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // AI Preferences
    responseStyle: {
      type: String,
      enum: ["concise", "balanced", "detailed"],
      default: "balanced",
    },

    studyLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },

    explanationMode: {
      type: String,
      enum: ["simple", "standard", "step-by-step"],
      default: "standard",
    },

    // App Preferences
    autoScroll: {
      type: Boolean,
      default: true,
    },

    enterToSend: {
      type: Boolean,
      default: true,
    },

    voiceInput: {
      type: Boolean,
      default: true,
    },

    focusMode: {
      type: Boolean,
      default: false,
    },

    studyReminder: {
      type: Boolean,
      default: false,
    },

    smartSuggestions: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema);
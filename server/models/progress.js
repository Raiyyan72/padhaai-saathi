const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    studySessions: {
      type: Number,
      default: 0,
    },

    questionsAsked: {
      type: Number,
      default: 0,
    },

    studyMinutes: {
      type: Number,
      default: 0,
    },

    currentStreak: {
      type: Number,
      default: 0,
    },

    lastStudyDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Progress ||
  mongoose.model("Progress", progressSchema);
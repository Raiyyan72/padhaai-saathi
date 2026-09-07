const mongoose = require("mongoose");

const librarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["note", "chat", "quiz", "study-plan"],
      default: "note",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Library", librarySchema);
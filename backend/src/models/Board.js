const mongoose = require("mongoose");

// One document per whiteboard. Holds shared text content and elements (shapes, textboxes, etc.)
const boardSchema = new mongoose.Schema(
  {
    boardId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
    elements: [
      {
        id: String,
        type: String, // 'textbox', 'radio', 'sticky', etc.
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        content: String,
        createdBy: String,
      },
    ],
    lastEditedBy: {
      type: String, // anonymous display name, e.g. "Anonymous Elephant"
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Board", boardSchema);

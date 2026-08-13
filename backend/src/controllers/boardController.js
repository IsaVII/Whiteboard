const Board = require("../models/Board");

// GET /api/boards/:boardId
// Fetches a board's saved content, creating an empty one if it doesn't exist yet.
// This is what the frontend calls once on load, before the socket takes over
// for live updates.
async function getOrCreateBoard(req, res) {
  const { boardId } = req.params;

  try {
    let board = await Board.findOne({ boardId });

    if (!board) {
      board = await Board.create({ boardId, content: "" });
    }

    console.log(
      `[boardController] getOrCreateBoard: boardId=${boardId}, content length=${board.content.length}`,
    );
    res.json({
      boardId: board.boardId,
      content: board.content,
      elements: board.elements || [],
      lastEditedBy: board.lastEditedBy,
      updatedAt: board.updatedAt,
    });
  } catch (err) {
    console.error("[boardController] getOrCreateBoard error:", err);
    res.status(500).json({ error: "Failed to load board" });
  }
}

module.exports = { getOrCreateBoard };

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

// GET /api/boards
// Lists all existing boards
async function getAllBoards(req, res) {
  try {
    const boards = await Board.find(
      {},
      { boardId: 1, createdAt: 1, updatedAt: 1 },
    ).sort({ updatedAt: -1 });
    console.log(
      `[boardController] getAllBoards: found ${boards.length} boards`,
    );
    res.json(boards);
  } catch (err) {
    console.error("[boardController] getAllBoards error:", err);
    res.status(500).json({ error: "Failed to load boards" });
  }
}

// POST /api/boards
// Creates a new board
async function createBoard(req, res) {
  const { boardId } = req.body;

  if (!boardId || !boardId.trim()) {
    return res.status(400).json({ error: "Board name is required" });
  }

  try {
    // Check if board already exists
    const existingBoard = await Board.findOne({ boardId: boardId.trim() });
    if (existingBoard) {
      return res.status(409).json({ error: "Board already exists" });
    }

    const newBoard = await Board.create({
      boardId: boardId.trim(),
      content: "",
    });
    console.log(
      `[boardController] createBoard: created boardId=${newBoard.boardId}`,
    );
    res.status(201).json({
      _id: newBoard._id,
      boardId: newBoard.boardId,
      content: newBoard.content,
      elements: newBoard.elements || [],
      createdAt: newBoard.createdAt,
    });
  } catch (err) {
    console.error("[boardController] createBoard error:", err);
    res.status(500).json({ error: "Failed to create board" });
  }
}

// PUT /api/boards/:boardId
// Renames a board by creating a new board with the new name and copying content
async function renameBoard(req, res) {
  const { boardId } = req.params;
  const { boardId: newBoardName } = req.body;

  if (!newBoardName || !newBoardName.trim()) {
    return res.status(400).json({ error: "New board name is required" });
  }

  try {
    // Fetch the existing board
    const oldBoard = await Board.findOne({ boardId });
    if (!oldBoard) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Check if new name already exists
    const existingBoard = await Board.findOne({ boardId: newBoardName.trim() });
    if (
      existingBoard &&
      existingBoard._id.toString() !== oldBoard._id.toString()
    ) {
      return res.status(409).json({ error: "Board name already exists" });
    }

    // Update the board with the new name
    const updatedBoard = await Board.findByIdAndUpdate(
      oldBoard._id,
      { boardId: newBoardName.trim() },
      { new: true },
    );

    console.log(
      `[boardController] renameBoard: renamed ${boardId} to ${newBoardName.trim()}`,
    );
    res.json({
      _id: updatedBoard._id,
      boardId: updatedBoard.boardId,
      content: updatedBoard.content,
      elements: updatedBoard.elements || [],
      updatedAt: updatedBoard.updatedAt,
    });
  } catch (err) {
    console.error("[boardController] renameBoard error:", err);
    res.status(500).json({ error: "Failed to rename board" });
  }
}

// DELETE /api/boards/:boardId
// Deletes a board
async function deleteBoard(req, res) {
  const { boardId } = req.params;

  try {
    const board = await Board.findOneAndDelete({ boardId });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    console.log(`[boardController] deleteBoard: deleted boardId=${boardId}`);
    res.json({ message: "Board deleted successfully", boardId });
  } catch (err) {
    console.error("[boardController] deleteBoard error:", err);
    res.status(500).json({ error: "Failed to delete board" });
  }
}

module.exports = {
  getOrCreateBoard,
  getAllBoards,
  createBoard,
  renameBoard,
  deleteBoard,
};

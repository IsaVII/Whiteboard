const express = require("express");
const {
  getOrCreateBoard,
  getAllBoards,
  createBoard,
  renameBoard,
  deleteBoard,
} = require("../controllers/boardController");

const router = express.Router();

// GET /api/boards - list all boards
router.get("/", getAllBoards);

// POST /api/boards - create a new board
router.post("/", createBoard);

// GET /api/boards/:boardId - get or create a specific board
router.get("/:boardId", getOrCreateBoard);

// PUT /api/boards/:boardId - rename a board
router.put("/:boardId", renameBoard);

// DELETE /api/boards/:boardId - delete a board
router.delete("/:boardId", deleteBoard);

module.exports = router;

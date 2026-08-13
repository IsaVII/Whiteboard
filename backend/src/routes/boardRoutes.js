const express = require("express");
const { getOrCreateBoard } = require("../controllers/boardController");

const router = express.Router();

router.get("/:boardId", getOrCreateBoard);

module.exports = router;

const Board = require("../models/Board");
const {
  generateAnonymousName,
  generateRandomColor,
} = require("../utils/nameGenerator");

// Debounce DB writes per board so we don't hit MongoDB on every keystroke
// from every user. Each board gets its own timer.
const saveTimers = new Map();
const SAVE_DELAY_MS = 800;

function scheduleSave(boardId, board) {
  if (saveTimers.has(boardId)) {
    clearTimeout(saveTimers.get(boardId));
  }

  const timer = setTimeout(async () => {
    try {
      await Board.findOneAndUpdate(
        { boardId },
        {
          content: board.content,
          elements: board.elements,
          lastEditedBy: board.lastEditedBy,
        },
        { upsert: true },
      );
    } catch (err) {
      console.error(`[socket] failed to save board ${boardId}:`, err.message);
    }
    saveTimers.delete(boardId);
  }, SAVE_DELAY_MS);

  saveTimers.set(boardId, timer);
}

// Tracks who's currently in each board room: Map<boardId, Map<socketId, {name, color}>>
const roomUsers = new Map();
// Tracks board state in memory for quick access
const boardState = new Map();

function getUsersInRoom(boardId) {
  const users = roomUsers.get(boardId);
  return users ? Array.from(users.values()) : [];
}

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    const anonymousName = generateAnonymousName();
    const userColor = generateRandomColor();
    socket.data.anonymousName = anonymousName;
    socket.data.userColor = userColor;

    console.log(
      `[socket] ${socket.id} connected as "${anonymousName}" (${userColor})`,
    );

    // Client emits this right after connecting, once it knows which board
    // (e.g. from the URL) it wants to join.
    socket.on("join-board", async (boardId) => {
      socket.data.boardId = boardId;
      socket.join(boardId);

      if (!roomUsers.has(boardId)) {
        roomUsers.set(boardId, new Map());
      }
      roomUsers
        .get(boardId)
        .set(socket.id, { name: anonymousName, color: userColor });

      // Tell the joining user who they are
      socket.emit("assigned-name", { name: anonymousName, color: userColor });

      // Tell everyone in the room (including the new user) the current roster
      io.to(boardId).emit("user-list", getUsersInRoom(boardId));

      // Load board state from database if not already in memory
      if (!boardState.has(boardId)) {
        try {
          const dbBoard = await Board.findOne({ boardId });
          if (dbBoard) {
            boardState.set(boardId, {
              content: dbBoard.content || "",
              elements: dbBoard.elements || [],
              lastEditedBy: dbBoard.lastEditedBy,
            });
          } else {
            // Create empty board state if it doesn't exist
            boardState.set(boardId, {
              content: "",
              elements: [],
              lastEditedBy: null,
            });
          }
        } catch (err) {
          console.error(
            `[socket] Failed to load board ${boardId} from DB:`,
            err.message,
          );
          // Fall back to empty state
          boardState.set(boardId, {
            content: "",
            elements: [],
            lastEditedBy: null,
          });
        }
      }

      // Send current board state to the joining user
      const board = boardState.get(boardId);
      socket.emit("elements-loaded", { elements: board.elements || [] });

      // Let others know someone joined
      socket.to(boardId).emit("user-joined", { name: anonymousName });
    });

    // Client emits this on every text change (ideally throttled/debounced
    // client-side too, e.g. every 100-200ms while typing).
    socket.on("content-change", ({ boardId, content }) => {
      if (!boardId) return;

      // Update in-memory board state
      if (!boardState.has(boardId)) {
        boardState.set(boardId, {
          content,
          elements: [],
          lastEditedBy: anonymousName,
        });
      }
      const board = boardState.get(boardId);
      board.content = content;
      board.lastEditedBy = anonymousName;

      // Broadcast to everyone else in the room immediately for live sync
      socket.to(boardId).emit("content-change", {
        content,
        editor: anonymousName,
      });

      // Persist in the background, debounced
      scheduleSave(boardId, board);
    });

    // Live cursor position broadcast. Purely ephemeral - never written to
    // boardState/MongoDB, just relayed to everyone else in the room.
    socket.on("cursor-move", ({ boardId, x, y }) => {
      if (!boardId) return;

      socket.to(boardId).emit("cursor-move", {
        socketId: socket.id,
        name: anonymousName,
        color: userColor,
        x,
        y,
      });
    });

    // Handle new element creation
    socket.on("element-added", ({ boardId, element }) => {
      if (!boardId) return;

      // Update in-memory board state
      if (!boardState.has(boardId)) {
        boardState.set(boardId, {
          content: "",
          elements: [],
          lastEditedBy: anonymousName,
        });
      }
      const board = boardState.get(boardId);
      board.elements.push(element);

      // Broadcast to everyone else in the room. The sender already added
      // the element to its own local state, so echoing it back with io.to()
      // would create a duplicate (and a duplicate React key).
      socket.to(boardId).emit("element-added", { element });

      // Persist in the background, debounced
      scheduleSave(boardId, board);
    });

    // Handle element position/content updates
    socket.on("element-updated", ({ boardId, elementId, updates }) => {
      if (!boardId) return;

      // Update in-memory board state
      if (boardState.has(boardId)) {
        const board = boardState.get(boardId);
        const element = board.elements.find((el) => el.id === elementId);
        if (element) {
          Object.assign(element, updates);
        }
      }

      // Broadcast to everyone else in the room
      socket.to(boardId).emit("element-updated", { elementId, updates });

      // Persist in the background, debounced
      if (boardState.has(boardId)) {
        scheduleSave(boardId, boardState.get(boardId));
      }
    });

    // Handle element deletion
    socket.on("element-removed", ({ boardId, elementId }) => {
      if (!boardId) return;

      // Update in-memory board state
      if (boardState.has(boardId)) {
        const board = boardState.get(boardId);
        board.elements = board.elements.filter((el) => el.id !== elementId);
      }

      // Broadcast to everyone in the room
      io.to(boardId).emit("element-removed", { elementId });

      // Persist in the background, debounced
      if (boardState.has(boardId)) {
        scheduleSave(boardId, boardState.get(boardId));
      }
    });

    socket.on("disconnect", () => {
      const { boardId } = socket.data;
      console.log(`[socket] ${socket.id} ("${anonymousName}") disconnected`);

      if (boardId && roomUsers.has(boardId)) {
        roomUsers.get(boardId).delete(socket.id);
        io.to(boardId).emit("user-list", getUsersInRoom(boardId));
        socket.to(boardId).emit("user-left", { name: anonymousName });
        // Remove their cursor from everyone else's screen
        socket.to(boardId).emit("cursor-left", { socketId: socket.id });

        if (roomUsers.get(boardId).size === 0) {
          roomUsers.delete(boardId);
          boardState.delete(boardId); // Clean up board state when room is empty
        }
      }
    });
  });
}

module.exports = registerSocketHandlers;

const { generateAnonymousName } = require("../utils/nameGenerator");

// Color palette for user badges
const BADGE_COLORS = [
  "bg-blue-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-green-400",
  "bg-yellow-400",
  "bg-red-400",
  "bg-indigo-400",
  "bg-cyan-400",
  "bg-orange-400",
  "bg-teal-400",
];

// Tracks who's currently in each board room: Map<boardId, Map<socketId, {name, color}>>
const roomUsers = new Map();
// Tracks board state in memory for quick access
const boardState = new Map();

function getUsersInRoom(boardId) {
  const users = roomUsers.get(boardId);
  return users ? Array.from(users.values()) : [];
}

// Generate a consistent color for a user based on their name
function getColorForUser(userName) {
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    const char = userName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const colorIndex = Math.abs(hash) % BADGE_COLORS.length;
  return BADGE_COLORS[colorIndex];
}

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    const anonymousName = generateAnonymousName();
    socket.data.anonymousName = anonymousName;

    console.log(`[socket] ${socket.id} connected as "${anonymousName}"`);

    // User joins a specific board - emitted by client after connecting
    socket.on("join-board", (boardId) => {
      socket.data.boardId = boardId;
      socket.join(boardId);

      if (!roomUsers.has(boardId)) {
        roomUsers.set(boardId, new Map());
      }

      // Assign a color based on user's name (consistent color per user)
      const userColor = getColorForUser(anonymousName);
      const userObject = { name: anonymousName, color: userColor };

      roomUsers.get(boardId).set(socket.id, userObject);
      socket.data.userColor = userColor;
      console.log(
        `[socket] ${anonymousName} joined board ${boardId} with color ${userColor}`,
      );

      // Tell the joining user who they are and their color
      socket.emit("assigned-name", { name: anonymousName, color: userColor });

      // Tell everyone in the room (including the new user) the current roster
      io.to(boardId).emit("user-list", getUsersInRoom(boardId));

      // Send current board state to the joining user
      if (boardState.has(boardId)) {
        const board = boardState.get(boardId);
        socket.emit("elements-loaded", { elements: board.elements || [] });
      }

      // Let others know someone joined
      socket.to(boardId).emit("user-joined", userObject);
    });

    // Handle cursor movement from this client
    socket.on("cursor-move", ({ boardId, x, y }) => {
      if (!boardId) {
        console.error("Board ID is not set. Cannot emit cursor position.");
        return;
      }

      socket.to(boardId).emit("cursor-move", {
        socketId: socket.id,
        name: anonymousName,
        color: socket.data.userColor,
        x,
        y,
      });
    });

    // Clean up user tracking and board state when user disconnects
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

module.exports = { registerSocketHandlers };

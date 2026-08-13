require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const { registerSocketHandlers } = require("./socket/socketHandlers");
const boardRoutes = require("./routes/boardRoutes");

const app = express();

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI;

// Allow both localhost and network IP for CORS
const corsOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  CLIENT_ORIGIN,
];

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Board routes
app.use("/api/boards", boardRoutes);

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is accessible at ${CLIENT_ORIGIN}`);
});

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

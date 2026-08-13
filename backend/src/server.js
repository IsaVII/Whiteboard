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

// CORS configuration - simplified for development
const corsOptions = {
  origin: "*", // Allow all origins in development for polling to work
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false,
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[server] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  console.log("[server] Health check from:", req.get("origin"));
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint
app.get("/api/test", (req, res) => {
  console.log("[server] Test endpoint from:", req.get("origin"));
  res.json({ message: "Backend OK!", timestamp: new Date().toISOString() });
});

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
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] ✅ HTTP Server running on port ${PORT}`);
  console.log(`[server] Localhost: http://localhost:${PORT}`);
  console.log(`[server] Test backend: http://localhost:${PORT}/api/test`);
});

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["polling", "websocket"], // Try polling first for mobile reliability
  allowUpgrades: true,
  pingInterval: 25000,
  pingTimeout: 20000,
  maxHttpBufferSize: 1e6, // 1MB
  path: "/socket.io",
});

console.log(
  "[server] Socket.IO server initialized with transports: polling, websocket",
);

// Log when socket connects and what transport is used
io.on("connection", (socket) => {
  const transport = socket.conn.transport.name;
  console.log(
    `[server] ✅ New connection - Socket ID: ${socket.id}, Transport: ${transport}`,
  );

  // Log when socket reconnects or upgrades transport
  socket.conn.on("upgrade", (newTransport) => {
    console.log(
      `[server] 📡 Socket ${socket.id} upgraded to transport: ${newTransport.name}`,
    );
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `[server] ❌ Socket ${socket.id} disconnected. Reason: ${reason}`,
    );
  });
});

// Log engine errors
io.engine.on("connection_error", (err) => {
  console.error(
    "[server] 🚨 Engine connection error:",
    err.code,
    err.message,
    err.context?.url,
  );
});

io.engine.on("upgrade_error", (err) => {
  console.warn(
    "[server] ⚠️ Engine upgrade error (can be ignored if polling works):",
    err.message,
  );
});

registerSocketHandlers(io);

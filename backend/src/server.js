require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const os = require("os");

const connectDB = require("./config/db");
const boardRoutes = require("./routes/boardRoutes");
const registerSocketHandlers = require("./socket/socketHandlers");

function getLanIPs() {
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

// CLIENT_ORIGIN can be a single origin or a comma-separated list, e.g.
// "http://localhost:5173,http://192.168.0.145:5173"
const extraOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const staticOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...extraOrigins,
];

// Matches http(s)://<private-LAN-IP>:<any-port>, e.g. 192.168.x.x, 10.x.x.x,
// 172.16-31.x.x. This lets any device on your LAN connect (phone, tablet,
// another laptop) without hand-editing CLIENT_ORIGIN every time an IP
// changes. Dev-only — tighten this before deploying anywhere public.
const LAN_ORIGIN_REGEX =
  /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

function isAllowedOrigin(origin) {
  // No origin header (e.g. curl, server-to-server, some health checks)
  if (!origin) return true;
  if (staticOrigins.includes(origin)) return true;
  if (NODE_ENV !== "production" && LAN_ORIGIN_REGEX.test(origin)) return true;
  return false;
}

const corsOriginHandler = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
  } else {
    console.warn(`[cors] Rejected origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  }
};

const app = express();
app.use(cors({ origin: corsOriginHandler }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/boards", boardRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

connectDB().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[server] listening on http://0.0.0.0:${PORT}`);
    getLanIPs().forEach((ip) => {
      console.log(`[server] accessible at http://${ip}:${PORT}`);
    });
  });
});

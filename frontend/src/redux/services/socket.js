import { io } from "socket.io-client";

// Dynamically determine Socket URL based on the current hostname
// This allows the app to work with both localhost and network IP
const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;

  if (envUrl) {
    console.log("[socket] Using env VITE_SOCKET_URL:", envUrl);
    return envUrl;
  }

  // Dynamically construct URL using current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = "4000"; // Backend port
  const url = `${protocol}//${hostname}:${port}`;

  console.log("[socket] Dynamically constructed URL:", url);
  console.log("[socket] Current location:", {
    hostname,
    protocol,
    port,
  });

  return url;
};

const SOCKET_URL = getSocketUrl();
console.log(`[socket] Final Socket URL: ${SOCKET_URL}`);

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  transports: ["polling", "websocket"], // Try polling first for mobile
  upgrade: true,
  path: "/socket.io",
});

// Test if backend is reachable before socket connection
console.log("[socket] Testing backend HTTP connectivity...");
fetch(`http://${window.location.hostname}:4000/api/test`)
  .then((res) => res.json())
  .then((data) => {
    console.log("[socket] ✅ Backend HTTP reachable:", data);
  })
  .catch((err) => {
    console.error(
      "[socket] ❌ Backend HTTP unreachable:",
      err.message,
      "- Trying socket connection anyway...",
    );
  });

// Debug socket events
socket.on("connect", () => {
  console.log(`[socket] ✅ Connected! Socket ID: ${socket.id}`);
  const transport = socket.io.engine.transport.name;
  console.log(`[socket] Connected via transport: ${transport}`);
  console.log("[socket] Socket state:", {
    connected: socket.connected,
    disconnected: socket.disconnected,
    transport,
  });
});

socket.on("connect_error", (error) => {
  console.error(`[socket] ❌ Connection error:`, error);
  console.error("[socket] Error message:", error.message);
  console.error("[socket] Error type:", error.type);
  console.error("[socket] Trying to reach:", SOCKET_URL);
  console.error("[socket] Current hostname:", window.location.hostname);
  console.error("[socket] Current protocol:", window.location.protocol);
});

socket.on("disconnect", (reason) => {
  console.warn(`[socket] Disconnected. Reason: ${reason}`);
});

// Log transport events
socket.io.engine.on("upgrade", (transport) => {
  console.log(`[socket] 📡 Engine upgraded to: ${transport.name}`);
});

socket.io.engine.on("upgrade_error", (err) => {
  console.warn(
    "[socket] ⚠️ Engine upgrade error (polling is still working):",
    err.message,
  );
});

// Log polling-specific errors
socket.io.engine.on("error", (error) => {
  console.error("[socket] 🚨 Engine error:", error);
});

socket.io.engine.on("message", (msg) => {
  if (msg && msg.type === "error") {
    console.error("[socket] Engine message error:", msg);
  }
});

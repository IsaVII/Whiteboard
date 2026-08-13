import { io } from "socket.io-client";

// Dynamically determine Socket URL based on the current hostname
// This allows the app to work with both localhost and network IP
const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  const hostname = window.location.hostname;

  // Only trust the env override when it's actually reachable from this
  // device. A `VITE_SOCKET_URL=http://localhost:4000` baked into .env is
  // only valid when the page itself was loaded from localhost — on a phone
  // loading the page from a LAN IP, "localhost" means the phone itself, so
  // we must ignore the env value and fall back to the dynamic hostname.
  if (envUrl) {
    try {
      const envHostname = new URL(envUrl).hostname;
      const envIsLocalhost = ["localhost", "127.0.0.1"].includes(envHostname);
      const pageIsLocalhost = ["localhost", "127.0.0.1"].includes(hostname);

      if (!envIsLocalhost || pageIsLocalhost) {
        return envUrl;
      }
      console.warn(
        `[socket] Ignoring VITE_SOCKET_URL="${envUrl}" because the page was loaded from "${hostname}", not localhost. Falling back to dynamic hostname.`,
      );
    } catch (err) {
      console.warn(
        `[socket] Invalid VITE_SOCKET_URL="${envUrl}", falling back to dynamic hostname.`,
      );
    }
  }

  // Otherwise, dynamically construct URL using current hostname
  const protocol = window.location.protocol;
  const port = "4000"; // Backend port

  return `${protocol}//${hostname}:${port}`;
};

const SOCKET_URL = getSocketUrl();
console.log(`[socket] Connecting to: ${SOCKET_URL}`);

// One shared socket instance for the whole app. autoConnect is left on
// (default), so importing this module opens the connection.
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log(`[socket] Connected: ${socket.id}`);
});

socket.on("connect_error", (err) => {
  console.error(`[socket] Connect error: ${err.message}`);
});

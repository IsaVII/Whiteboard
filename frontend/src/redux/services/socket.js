import { io } from "socket.io-client";

// Dynamically determine Socket URL based on the current hostname
// This allows the app to work with both localhost and network IP
const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;

  if (envUrl) {
    return envUrl;
  }

  // Dynamically construct URL using current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = "4000"; // Backend port

  return `${protocol}//${hostname}:${port}`;
};

const SOCKET_URL = getSocketUrl();

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});

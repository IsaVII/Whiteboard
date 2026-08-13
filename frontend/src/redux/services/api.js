// Dynamically determine API URL based on the current hostname
// This allows the app to work with both localhost and network IP
const getAPIUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  // If an env URL is specified, use it
  if (envUrl) {
    return envUrl;
  }

  // Otherwise, dynamically construct URL using current hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = "4000"; // Backend port

  return `${protocol}//${hostname}:${port}`;
};

const API_URL = getAPIUrl();

export async function fetchBoard(boardId) {
  const res = await fetch(`${API_URL}/api/boards/${boardId}`);
  if (!res.ok) {
    throw new Error(`Failed to load board: ${res.status}`);
  }
  return res.json();
}

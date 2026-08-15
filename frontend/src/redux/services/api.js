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

export async function listBoards() {
  const res = await fetch(`${API_URL}/api/boards`);
  if (!res.ok) {
    throw new Error(`Failed to load boards: ${res.status}`);
  }
  return res.json();
}

export async function createNewBoard(boardName) {
  const res = await fetch(`${API_URL}/api/boards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ boardId: boardName }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create board: ${res.status}`);
  }
  return res.json();
}

export async function renameBoard(boardId, newBoardName) {
  const res = await fetch(`${API_URL}/api/boards/${boardId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ boardId: newBoardName }),
  });
  if (!res.ok) {
    throw new Error(`Failed to rename board: ${res.status}`);
  }
  return res.json();
}

export async function deleteBoard(boardId) {
  const res = await fetch(`${API_URL}/api/boards/${boardId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to delete board: ${res.status}`);
  }
  return res.json();
}

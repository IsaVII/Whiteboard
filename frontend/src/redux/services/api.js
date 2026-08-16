// Dynamically determine API URL based on the current hostname
// This allows the app to work with both localhost and network IP
const getAPIUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  // If an env URL is specified, use it
  if (envUrl) {
    return envUrl;
  }

  // In dev, the frontend (Vite, :5173) and backend (:4000) run as separate
  // servers, so keep pointing at the backend's dev port explicitly.
  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }

  // In production (combined deployment), the backend serves the built
  // frontend itself, so API calls are same-origin — no port needed.
  return `${window.location.protocol}//${window.location.host}`;
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

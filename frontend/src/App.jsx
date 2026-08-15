import { useEffect } from "react";
import {
  loadBoard,
  connectionStatusChanged,
  elementsLoaded,
  elementAdded,
  elementUpdated,
  elementRemoved,
} from "./redux/slices/boardSlice";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import "./App.css";
import Header from "./components/Header";
import Whiteboard from "./pages/Whiteboard";
import Footer from "./components/Footer";
import DebugPanel from "./components/DebugPanel";
import { socket } from "./redux/services/socket";

import {
  setName,
  userListUpdated,
  cursorMoved,
  cursorLeft,
  clearCursors,
} from "./redux/slices/userSlice";

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
const DEFAULT_BOARD_ID = "whiteboard-main";

function App() {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.board.status);
  const connected = useSelector((state) => state.board.connected);
  const lastEditor = useSelector((state) => state.board.lastEditor);
  const boardId = useSelector((state) => state.board.boardId);

  // Load saved content from MongoDB via REST once on mount
  useEffect(() => {
    dispatch(loadBoard(DEFAULT_BOARD_ID));
  }, [dispatch]);

  // Clear cursors when board changes
  useEffect(() => {
    dispatch(clearCursors());
  }, [boardId, dispatch]);

  useEffect(() => {
    //board connection
    function handleConnect() {
      console.log("[socket] Connected to server with socket ID:", socket.id);
      dispatch(connectionStatusChanged(true));
      console.log(
        `[socket] Emitting join-board event for board: ${DEFAULT_BOARD_ID}`,
      );
      socket.emit("join-board", DEFAULT_BOARD_ID);
    }

    function handleDisconnect() {
      console.log("[socket] Disconnected from server");
      dispatch(connectionStatusChanged(false));
    }

    // When server assigns a name to this user
    function handleAssignedName(data) {
      console.log(
        `[socket] Assigned name: ${data.name} with color ${data.color}`,
      );
      dispatch(setName(data));
    }

    // When server sends the user list
    function handleUserList(names) {
      dispatch(userListUpdated(names));
    }

    function handleCursorMove({ socketId, name, color, x, y }) {
      dispatch(cursorMoved({ socketId, name, color, x, y }));
    }

    function handleCursorLeft({ socketId }) {
      dispatch(cursorLeft({ socketId }));
    }

    // Snapshot of shapes/textboxes sent right after joining a board
    function handleElementsLoaded({ elements }) {
      dispatch(elementsLoaded(elements));
    }

    // Another user added a shape/textbox
    function handleElementAdded({ element }) {
      dispatch(elementAdded(element));
    }

    // Another user dragged or edited a shape/textbox
    function handleElementUpdated({ elementId, updates }) {
      dispatch(elementUpdated({ elementId, updates }));
    }

    // Another user deleted a shape/textbox
    function handleElementRemoved({ elementId }) {
      dispatch(elementRemoved({ elementId }));
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("assigned-name", handleAssignedName);
    socket.on("user-list", handleUserList);
    socket.on("cursor-move", handleCursorMove);
    socket.on("cursor-left", handleCursorLeft);
    socket.on("elements-loaded", handleElementsLoaded);
    socket.on("element-added", handleElementAdded);
    socket.on("element-updated", handleElementUpdated);
    socket.on("element-removed", handleElementRemoved);

    // If the socket is already connected by the time this effect runs
    // (e.g. fast refresh), fire the join manually.
    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("assigned-name", handleAssignedName);
      socket.off("user-list", handleUserList);
      socket.off("cursor-move", handleCursorMove);
      socket.off("cursor-left", handleCursorLeft);
      socket.off("elements-loaded", handleElementsLoaded);
      socket.off("element-added", handleElementAdded);
      socket.off("element-updated", handleElementUpdated);
      socket.off("element-removed", handleElementRemoved);
    };
  }, [dispatch]);

  return (
    <>
      <Header />
      <Whiteboard />
      <Footer />
      <DebugPanel />
    </>
  );
}

export default App;

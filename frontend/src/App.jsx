import { useEffect } from "react";
import { loadBoard } from "./redux/slices/boardSlice";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import "./App.css";
import Header from "./components/Header";
import Whiteboard from "./pages/Whiteboard";
import Footer from "./components/Footer";
import { socket } from "./redux/services/socket";

import {
  setName,
  userListUpdated,
  cursorMoved,
  cursorLeft,
} from "./redux/slices/userSlice";
import { connectionStatusChanged } from "./redux/slices/boardSlice";

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
const DEFAULT_BOARD_ID = "whiteboard-main";

function App() {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.board.status);
  const connected = useSelector((state) => state.board.connected);
  const lastEditor = useSelector((state) => state.board.lastEditor);

  // Load saved content from MongoDB via REST once on mount
  useEffect(() => {
    dispatch(loadBoard(DEFAULT_BOARD_ID));
  }, [dispatch]);

  useEffect(() => {
    //board connection
    function handleConnect() {
      console.log("[socket] Connected to server");
      dispatch(connectionStatusChanged(true));
      socket.emit("join-board", DEFAULT_BOARD_ID);
    }

    function handleDisconnect() {
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

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("assigned-name", handleAssignedName);
    socket.on("user-list", handleUserList);
    socket.on("cursor-move", handleCursorMove);
    socket.on("cursor-left", handleCursorLeft);

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
    };
  }, [dispatch]);

  return (
    <>
      <Header />
      <Whiteboard />
      <Footer />
    </>
  );
}

export default App;

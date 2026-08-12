import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import "./App.css";
import Header from "./components/Header";
import Whiteboard from "./pages/Whiteboard";
import Footer from "./components/Footer";
import {
  setName,
  setUsersInRoom,
  addUserToRoom,
  removeUserFromRoom,
} from "./redux/slices/userSlice";

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
const DEFAULT_BOARD_ID = "whiteboard-main";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Connect to Socket.IO server
    const socket = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    function handleConnect() {
      console.log("[socket] Connected to server");
      // Join the default board
      socket.emit("join-board", DEFAULT_BOARD_ID);
    }

    // When server assigns a name to this user
    function handleAssignedName(data) {
      console.log("[socket] Assigned name:", data.name);
      dispatch(setName(data));
    }

    // When server sends the user list
    function handleUserList(usersList) {
      console.log("[socket] User list:", usersList);
      dispatch(setUsersInRoom(usersList));
    }

    // When another user joins
    function handleUserJoined(data) {
      console.log("[socket] User joined:", data.name);
      dispatch(addUserToRoom(data));
    }

    function handleDisconnected(data) {
      console.log("[socket] User disconnected:", data.name);
      dispatch(removeUserFromRoom(data));
    }

    socket.on("connect", handleConnect);
    socket.on("assigned-name", handleAssignedName);
    socket.on("user-list", handleUserList);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-disconnected", handleDisconnected);

    return () => {
      socket.disconnect();
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

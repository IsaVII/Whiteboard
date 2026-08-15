import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../services/socket";
import {
  listBoards,
  createNewBoard,
  renameBoard,
  fetchBoard,
  deleteBoard,
} from "../services/api";
import { boardChanged, elementsLoaded } from "../slices/boardSlice";

export const useBoardManager = () => {
  const dispatch = useDispatch();
  const currentBoardName = useSelector((state) => state.board.boardName);
  const currentBoardId = useSelector((state) => state.board.boardId);

  const [boardName, setBoardName] = useState("");
  const [boards, setBoards] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [renameMode, setRenameMode] = useState(false);
  const [newName, setNewName] = useState(currentBoardName || "");
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);

  useEffect(() => {
    loadBoardsList();
  }, []);

  // Update input when the current board name changes
  useEffect(() => {
    setNewName(currentBoardName || "");
  }, [currentBoardName]);

  const loadBoardsList = async () => {
    try {
      const data = await listBoards();
      setBoards(data);
    } catch (err) {
      console.error("Failed to load boards:", err);
    }
  };

  const handleCreateNewBoard = async () => {
    if (!boardName.trim()) return alert("Please enter a board name");

    setLoading(true);
    try {
      const newBoard = await createNewBoard(boardName);
      setBoardName("");

      if (currentBoardId) {
        socket.emit("leave-board", { boardId: currentBoardId });
      }

      const boardData = await fetchBoard(newBoard.boardId);
      dispatch(boardChanged({ boardId: newBoard.boardId }));
      dispatch(elementsLoaded(boardData.elements || []));

      socket.emit("join-board", newBoard.boardId);
      await loadBoardsList();
    } catch (err) {
      console.error("Failed to create board:", err);
      alert("Error creating board");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBoard = async (boardId) => {
    setLoading(true);
    try {
      const boardData = await fetchBoard(boardId);
      dispatch(boardChanged({ boardId }));
      dispatch(elementsLoaded(boardData.elements || []));

      if (currentBoardId) {
        socket.emit("leave-board", { boardId: currentBoardId });
      }

      socket.emit("join-board", boardId);
      setShowDropdown(false);
    } catch (err) {
      console.error("Failed to load board:", err);
      alert("Error loading board");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsNewName = async () => {
    if (!newName.trim()) return alert("Please enter a board name");
    if (newName === currentBoardName) {
      alert("Please enter a different name");
      setRenameMode(false);
      return;
    }

    setLoading(true);
    try {
      await renameBoard(currentBoardId, newName);
      dispatch(boardChanged({ boardId: newName }));
      setRenameMode(false);
      await loadBoardsList();
    } catch (err) {
      console.error("Failed to rename board:", err);
      alert("Error renaming board");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!boardToDelete) return;

    setLoading(true);
    try {
      await deleteBoard(boardToDelete);
      setShowDeleteModal(false);
      setBoardToDelete(null);

      // If we deleted the currently open board, leave it
      if (currentBoardId === boardToDelete) {
        if (currentBoardId) {
          socket.emit("leave-board", { boardId: currentBoardId });
        }
        dispatch(boardChanged({ boardId: null }));
        dispatch(elementsLoaded([]));
      }

      await loadBoardsList();
    } catch (err) {
      console.error("Failed to delete board:", err);
      alert("Error deleting board");
      setShowDeleteModal(false);
      setBoardToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (boardId) => {
    setBoardToDelete(boardId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setBoardToDelete(null);
  };

  return {
    state: {
      boardName,
      boards,
      showDropdown,
      renameMode,
      newName,
      loading,
      currentBoardName,
      currentBoardId,
      showDeleteModal,
      boardToDelete,
    },
    actions: {
      setBoardName,
      setShowDropdown,
      setRenameMode,
      setNewName,
      handleCreateNewBoard,
      handleLoadBoard,
      handleSaveAsNewName,
      openDeleteModal,
      closeDeleteModal,
      handleDeleteBoard,
    },
  };
};

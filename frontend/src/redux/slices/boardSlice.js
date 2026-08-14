import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchBoard } from "../services/api";

export const loadBoard = createAsyncThunk(
  "board/loadBoard",
  async (boardId) => {
    const data = await fetchBoard(boardId);
    return data;
  },
);

const boardSlice = createSlice({
  name: "board",
  initialState: {
    boardId: null,
    content: "",
    elements: [], // Array of {id, type, shapeType, x, y, width, height, content, createdBy}
    selectedToolType: "rectangle", // last shape picked from the toolbar dropdown
    status: "idle", // idle | loading | ready | error
    connected: false,
    lastEditor: null,
  },
  reducers: {
    connectionStatusChanged(state, action) {
      state.connected = action.payload;
    },
    // Remembers the last shape picked from the toolbar dropdown so the
    // main button icon and the short-press action reflect it.
    toolTypeSelected(state, action) {
      state.selectedToolType = action.payload;
    },
    // Snapshot sent by the server right after join-board.
    elementsLoaded(state, action) {
      state.elements = action.payload || [];
    },
    elementAdded(state, action) {
      const element = action.payload;
      // Guard against double-adds
      if (!state.elements.some((el) => el.id === element.id)) {
        state.elements.push(element);
      }
    },
    elementUpdated(state, action) {
      const { elementId, updates } = action.payload;
      const element = state.elements.find((el) => el.id === elementId);
      if (element) {
        Object.assign(element, updates);
      }
    },
    elementRemoved(state, action) {
      state.elements = state.elements.filter(
        (el) => el.id !== action.payload.elementId,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadBoard.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadBoard.fulfilled, (state, action) => {
        state.status = "ready";
        state.boardId = action.payload.boardId;
        state.content = action.payload.content;
        state.elements = action.payload.elements || [];
        state.lastEditor = action.payload.lastEditedBy;
      })
      .addCase(loadBoard.rejected, (state) => {
        state.status = "error";
      });
  },
});

export const {
  connectionStatusChanged,
  toolTypeSelected,
  elementsLoaded,
  elementAdded,
  elementUpdated,
  elementRemoved,
} = boardSlice.actions;
export default boardSlice.reducer;

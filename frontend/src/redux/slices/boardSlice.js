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
    elements: [], // Array of {id, type, x, y, width, height, content, createdBy}
    selectedToolType: null, // 'textbox', 'radio', 'sticky', or null
    status: "idle", // idle | loading | ready | error
    connected: false,
    lastEditor: null,
  },
  reducers: {
    connectionStatusChanged(state, action) {
      state.connected = action.payload;
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

export const { connectionStatusChanged } = boardSlice.actions;
export default boardSlice.reducer;

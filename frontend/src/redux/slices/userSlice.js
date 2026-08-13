import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  name: "",
  color: "",
  usersInRoom: [],
  cursors: {},
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setName: (state, action) => {
      state.name = action.payload.name;
      state.color = action.payload.color || "";
    },
    userListUpdated(state, action) {
      state.usersInRoom = action.payload;
    },
    cursorMoved(state, action) {
      const { socketId, name, color, x, y } = action.payload;
      state.cursors[socketId] = { name, color, x, y };
    },
    cursorLeft(state, action) {
      delete state.cursors[action.payload.socketId];
    },
  },
});

export const { setName, userListUpdated, cursorMoved, cursorLeft } =
  userSlice.actions;
export default userSlice.reducer;

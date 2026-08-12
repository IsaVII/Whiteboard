import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  name: "",
  color: "",
  usersInRoom: [],
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setName: (state, action) => {
      state.name = action.payload.name;
      state.color = action.payload.color || "";
    },
    setUsersInRoom: (state, action) => {
      state.usersInRoom = action.payload;
    },
    addUserToRoom: (state, action) => {
      const userExists = state.usersInRoom.some(
        (user) => user.name === action.payload.name,
      );
      if (!userExists) {
        state.usersInRoom.push(action.payload);
      }
    },
    removeUserFromRoom: (state, action) => {
      state.usersInRoom = state.usersInRoom.filter(
        (user) => user.name !== action.payload.name,
      );
    },
  },
});

export const { setName, setUsersInRoom, addUserToRoom, removeUserFromRoom } =
  userSlice.actions;
export default userSlice.reducer;

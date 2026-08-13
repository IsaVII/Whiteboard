import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import boardReducer from "./slices/boardSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    board: boardReducer,
  },
});

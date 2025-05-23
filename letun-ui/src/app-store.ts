import { configureStore } from "@reduxjs/toolkit";
import { loginSlice } from "./slices/login/login-slice";
import { userSlice } from "./slices/user/user-slice";
import { usersSlice } from "./slices/users/users-slice";
import { invitesSlice } from "./slices/invites/invites-slice";
import { useDispatch } from "react-redux";
import { inviteSlice } from "./slices/invite/invite-slice";

export const store = configureStore({
  reducer: {
    login: loginSlice.reducer,
    invite: inviteSlice.reducer,
    user: userSlice.reducer,
    users: usersSlice.reducer,
    invites: invitesSlice.reducer,
  },
});

export type RootStore = ReturnType<typeof store.getState>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
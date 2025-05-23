import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { UserState, UserStateType } from "./user-state";
import afetch from "@/src/core/afetch";
import User from "@/src/models/users/user";
import { deleteTokens } from "@/src/core/session/session";

const initialUserState: UserState = <UserState>{
  type: UserStateType.init,
};

export const userSlice = createSlice({
  name: "user",
  initialState: initialUserState,
  selectors: {
    selectUser: (state): User | undefined => {
      if (state.type == UserStateType.loaded) {
        return state.user;
      }

      return undefined;
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(initUserAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(initUserAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.requestError = "";
      state.type = UserStateType.loaded;

      if (state.type === UserStateType.loaded) {
        state.user = action.payload as User;
      }
    });

    builder.addCase(initUserAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.type = UserStateType.error;
      state.requestError = (action.payload as string) || "Unknown error";
    });

    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.type = UserStateType.init;
    });
  },
});

export const initUserAsync = createAsyncThunk(
  "user/initAsync",
  async (_, thunkApi) => {
    const response = await afetch("https://local.api.letun:8080/user", {
      method: "GET",
    });

    if (response?.status != 200) {
      return thunkApi.rejectWithValue("Возникла error");
    }

    const json = await response.json();
    const resp = json as User;

    return thunkApi.fulfillWithValue(resp);
  }
);

export const logoutAsync = createAsyncThunk(
  "user/logoutAsync",
  async () => {
    await afetch("https://local.api.letun:8080/auth/logout", {
      method: "POST",
    });

    await deleteTokens();

    document.location.href = "/login";
  }
);
export const userSelectors = userSlice.selectors;
export const userActions = userSlice.actions;

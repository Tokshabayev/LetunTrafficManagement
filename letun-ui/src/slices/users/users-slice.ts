import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/src/app-store";
import afetch from "@/src/core/afetch";
import { UserCreateState, UsersState, UserUpdateState } from "./users-state";
import UsersList from "@/src/models/users/users-list";
import { getAllUsers } from "./users-helpers";
import { toast } from "sonner";
import User from "@/src/models/users/user";
import UserUpdateRequest from "@/src/models/users/user-update-request";
import UserCreateRequest from "@/src/models/users/user-create-request";
import { isEmailValid } from "@/src/core/validators/email-validator";
import { isPhoneValid } from "@/src/core/validators/phone-validator";
import { formatPhoneNumber } from "@/src/core/formatters/phone-number";

const initialUsersState: UsersState = <UsersState>{
  users: [],
  isLoading: false,
  page: 1,
  take: 10,
  filter: "",
  total: 0,
  maxPage: 0,
  error: undefined,
  createState: {
    user: undefined,
    error: undefined,
    isValid: false,
    isOpen: false,
    draft: {
      email: "",
      name: "",
      phoneNumber: "",
      roleCode: "",
    },
  },
  updateState: {
    user: undefined,
    draft: {
      id: 0,
      isActive: true,
      email: "",
      name: "",
      phoneNumber: "",
      roleCode: "",
    },
    error: undefined,
    isValid: false,
    isOpen: false,
  },
};

export const usersSlice = createSlice({
  name: "users",
  initialState: initialUsersState,
  reducers: {
    setPage: (state, { payload }: PayloadAction<number>) => {
      state.page = payload;
    },

    setTake: (state, { payload }: PayloadAction<number>) => {
      state.take = payload;
    },

    setFilter: (state, { payload }: PayloadAction<string>) => {
      state.filter = payload;
    },

    clear: (state) => {
      state.page = 1;
      state.take = 10;
      state.filter = "";
      state.total = 0;
      state.maxPage = 0;
      state.users = [];
    },

    setCreateStateDraft: (
      state,
      { payload }: PayloadAction<UserCreateRequest>
    ) => {
      state.createState.draft = payload;

      let emailValid = true;
      if ((payload.email ?? "").length > 0) {
        emailValid = isEmailValid(payload.email);
      }
      const phoneValid = isPhoneValid(payload.phoneNumber);
      const roleValid = (payload.roleCode ?? "").length > 0;

      state.createState.isValid = emailValid && phoneValid && roleValid;
    },

    setCreateStateOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.createState.isOpen = payload;
    },

    setUpdateStateUser: (state, { payload }: PayloadAction<User>) => {
      state.updateState.draft = payload;
      state.updateState.user = payload;
      state.updateState.draft.phoneNumber = formatPhoneNumber(
        payload.phoneNumber
      );
      state.updateState.user.phoneNumber = state.updateState.draft.phoneNumber;
      state.updateState.isValid = false;
      state.updateState.isOpen = true;
    },

    setUpdateStateOpen: (state, { payload }: PayloadAction<boolean>) => {
      state.updateState.isOpen = payload;
    },

    setUpdateStateDraft: (
      state,
      { payload }: PayloadAction<UserUpdateRequest>
    ) => {
      state.updateState.draft = payload;

      let emailValid = true;
      if ((payload.email ?? "").length > 0) {
        emailValid = isEmailValid(payload.email);
      }

      const phoneValid = isPhoneValid(payload.phoneNumber);
      const roleValid = (payload.roleCode ?? "").length > 0;

      const user = state.updateState.user;
      const draft = state.updateState.draft;

      const hasChanges =
        user?.name !== draft.name ||
        user?.email !== draft.email ||
        user?.phoneNumber !== draft.phoneNumber ||
        user?.roleCode !== draft.roleCode;

      state.updateState.isValid =
        emailValid && phoneValid && roleValid && hasChanges;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(uploadUsersAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(uploadUsersAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = "";
      state.users = action.payload.users ?? [];
      state.total = action.payload.total;
      state.maxPage = action.payload.maxPage;
    });

    builder.addCase(uploadUsersAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || "Unknown error";
    });

    builder.addCase(submitCreateUserAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(submitCreateUserAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = "";
      state.users = action.payload.users ?? [];
      state.total = action.payload.total;
      state.maxPage = action.payload.maxPage;
      state.createState.isOpen = false;
      state.createState.draft = {
        email: "",
        name: "",
        phoneNumber: "",
        roleCode: "",
      };
      state.createState.isValid = false;
      state.createState.error = undefined;
    });

    builder.addCase(submitCreateUserAsync.rejected, (state, action) => {
      console.log(action.payload);
      state.isLoading = false;
      state.createState.error = (action.payload as string) || "Unknown error";
    });

    builder.addCase(submitUpdateUserAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(submitUpdateUserAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = "";
      state.users = action.payload.users ?? [];
      state.total = action.payload.total;
      state.maxPage = action.payload.maxPage;
      state.updateState.isOpen = false;
      state.updateState.draft = {
        id: 0,
        isActive: true,
        email: "",
        name: "",
        phoneNumber: "",
        roleCode: "",
      };
      state.updateState.isValid = false;
      state.updateState.error = undefined;
    });

    builder.addCase(submitUpdateUserAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.updateState.error = (action.payload as string) || "Unknown error";
    });

    builder.addCase(blockUserAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(blockUserAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = "";
      state.users = action.payload.users ?? [];
      state.total = action.payload.total;
      state.maxPage = action.payload.maxPage;
    });

    builder.addCase(blockUserAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || "Unknown error";
    });

    builder.addCase(unblockUserAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(unblockUserAsync.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = "";
      state.users = action.payload.users ?? [];
      state.total = action.payload.total;
      state.maxPage = action.payload.maxPage;
    });

    builder.addCase(unblockUserAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = (action.payload as string) || "Unknown error";
    });
  },
});

export const uploadUsersAsync = createAsyncThunk(
  "user/uploadUsersAsync",
  async (_, thunkApi) => {
    const state = (thunkApi.getState() as RootState).users;

    const response = await getAllUsers({
      page: state.page,
      take: state.take,
      filter: state.filter,
    });

    const json = await response.json();
    const resp = json as UsersList;

    return thunkApi.fulfillWithValue(resp);
  }
);

export const submitCreateUserAsync = createAsyncThunk(
  "user/submitCreateUserAsync",
  async (_, thunkApi) => {
    const state = (thunkApi.getState() as RootState).users;

    if (!state.createState.isValid) {
      return thunkApi.rejectWithValue("Is not valid");
    }

    const response = await afetch(
      `https://local.api.letun:8080/user/create`,
      {
        method: "POST",
        body: JSON.stringify(state.createState.draft!),
      }
    );

    if (response?.status != 200) {
      const text = (await response?.text())?.trim();
      switch (text) {
        case "user-with-email-exists":
          return thunkApi.rejectWithValue(
            "User with this email already exists"
          );
        case "user-with-phone-exists":
          return thunkApi.rejectWithValue(
            "User with this phone number already exists"
          );
        case "role-not-found":
          return thunkApi.rejectWithValue("Role not found");
        default:
          return thunkApi.rejectWithValue("Unknown error");
      }
    }

    const usersResponse = await getAllUsers({
      page: state.page,
      take: state.take,
      filter: state.filter,
    });

    if (response?.status != 200) {
      const text = (await response?.text())?.trim();
      throw new Error(text);
    }

    const json = await usersResponse.json();
    const resp = json as UsersList;

    return thunkApi.fulfillWithValue(resp);
  }
);

export const submitUpdateUserAsync = createAsyncThunk(
  "user/submitUpdateUserAsync",
  async (_, thunkApi) => {
    const state = (thunkApi.getState() as RootState).users;

    if (!state.updateState.isValid) {
      return thunkApi.rejectWithValue("Is not valid");
    }

    const response = await afetch(
      `https://local.api.letun:8080/user/update`,
      {
        method: "PUT",
        body: JSON.stringify(state.updateState.draft!),
      }
    );

    if (response?.status != 200) {
      const text = (await response?.text())?.trim();
      switch (text) {
        case "user-with-email-exists":
          return thunkApi.rejectWithValue(
            "User with this email already exists"
          );
        case "user-with-phone-exists":
          return thunkApi.rejectWithValue(
            "User with this phone number already exists"
          );
        case "role-not-found":
          return thunkApi.rejectWithValue("Role not found");
        default:
          return thunkApi.rejectWithValue("Unknown error");
      }
    }

    const usersResponse = await getAllUsers({
      page: state.page,
      take: state.take,
      filter: state.filter,
    });

    if (response?.status != 200) {
      const text = (await response?.text())?.trim();
      throw new Error(text);
    }

    const json = await usersResponse.json();
    const resp = json as UsersList;

    return thunkApi.fulfillWithValue(resp);
  }
);

export const blockUserAsync = createAsyncThunk(
  "user/blockUserAsync",
  async (id: number, thunkApi) => {
    const response = await afetch(
      `https://local.api.letun:8080/user/block/${id}`,
      {
        method: "PUT",
      }
    );

    if (response?.status != 200) {
      const text = (await response?.text())?.trim();

      switch (text) {
        case "user-not-found":
          toast.error("User not found");
          break;
        case "user-already-blocked":
          toast.error("User already blocked");
          break;
        default:
          toast.error("Unknown error");
      }

      throw new Error(text);
    }

    const state = (thunkApi.getState() as RootState).users;

    const usersResponse = await getAllUsers({
      page: state.page,
      take: state.take,
      filter: state.filter,
    });

    const json = await usersResponse.json();
    const resp = json as UsersList;

    return thunkApi.fulfillWithValue(resp);
  }
);

export const unblockUserAsync = createAsyncThunk(
  "user/unblockUserAsync",
  async (id: number, thunkApi) => {
    const response = await afetch(
      `https://local.api.letun:8080/user/unblock/${id}`,
      {
        method: "PUT",
      }
    );

    if (response?.status != 200) {
      const text = (await response?.text())?.trim();

      switch (text) {
        case "user-not-found":
          toast.error("User not found");
          break;
        case "user-already-unblocked":
          toast.error("User already unblocked");
          break;
        default:
          toast.error("Unknown error");
      }

      throw new Error(text);
    }

    const state = (thunkApi.getState() as RootState).users;

    const usersResponse = await getAllUsers({
      page: state.page,
      take: state.take,
      filter: state.filter,
    });

    const json = await usersResponse.json();
    const resp = json as UsersList;

    return thunkApi.fulfillWithValue(resp);
  }
);

export const usersActions = usersSlice.actions;

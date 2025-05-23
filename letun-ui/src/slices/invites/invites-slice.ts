import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/src/app-store";
import afetch from "@/src/core/afetch";
import { InvitesState } from "./invites-state";
import { isEmailValid } from "@/src/core/validators/email-validator";
import { fetchInvitesList, getInviteParams } from "./invites-helpers";

const initialInvitesState: InvitesState = <InvitesState>{
    invites: [],
    isLoading: false,
    page: 1,
    take: 10,
    filter: "",
    total: 0,
    maxPage: 0,
    error: undefined,
    inviteUser: {
        email: "",
        role: "",
        isValid: false,
        error: undefined,
        success: false,
        isOpen: false,
    },
};

export const invitesSlice = createSlice({
    name: "invites",
    initialState: initialInvitesState,
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
            state.invites = [];
            state.inviteUser = {
                email: "",
                role: "",
                isValid: false,
                error: undefined,
                isOpen: false,
            };
        },

        setInviteUserEmail: (state, { payload }: PayloadAction<string>) => {
            state.inviteUser.email = payload;
            state.inviteUser.isValid =
                isEmailValid(payload) && state.inviteUser.role.length > 0;
        },

        setInviteUserRole: (state, { payload }: PayloadAction<string>) => {
            state.inviteUser.role = payload;
            state.inviteUser.isValid =
                isEmailValid(state.inviteUser.email) && payload.length > 0;
        },

        setInviteOpen: (state, { payload }: PayloadAction<boolean>) => {
            state.inviteUser.isOpen = payload;

            if (!payload) {
                state.inviteUser.email = "";
                state.inviteUser.role = "";
                state.inviteUser.isValid = false;
                state.inviteUser.error = undefined;
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(uploadInvitesAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(uploadInvitesAsync.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = "";
            state.invites = action.payload.invites ?? [];
            state.total = action.payload.total;
            state.maxPage = action.payload.maxPage;
        });

        builder.addCase(uploadInvitesAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.error = (action.payload as string) || "Unknown error";
        });

        builder.addCase(sendInviteAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(sendInviteAsync.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = "";
            state.invites = action.payload.invites ?? [];
            state.total = action.payload.total;
            state.maxPage = action.payload.maxPage;
            state.inviteUser.error = undefined;
            state.inviteUser.isValid = false;
            state.inviteUser.email = "";
            state.inviteUser.role = "";
            state.inviteUser.isOpen = false;
        });

        builder.addCase(sendInviteAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.inviteUser.error = (action.payload as string) || "Unknown error";
        });

        builder.addCase(resendInviteAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(resendInviteAsync.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = "";
            state.invites = action.payload.invites ?? [];
            state.total = action.payload.total;
            state.maxPage = action.payload.maxPage;
        });

        builder.addCase(resendInviteAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.error = (action.payload as string) || "Unknown error";
        });

        builder.addCase(deleteInviteAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(deleteInviteAsync.fulfilled, (state, action) => {
            state.isLoading = false;
            state.error = "";
            state.invites = action.payload.invites ?? [];
            state.total = action.payload.total;
            state.maxPage = action.payload.maxPage;
        });

        builder.addCase(deleteInviteAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.error = (action.payload as string) || "Unknown error";
        });
    },
});

export const uploadInvitesAsync = createAsyncThunk(
    "invite/uploadInvitesAsync",
    async (_, thunkApi) => {
        const state = (thunkApi.getState() as RootState).invites;
        const params = getInviteParams(state);
        const list = await fetchInvitesList(params);

        return thunkApi.fulfillWithValue(list);
    }
);

export const sendInviteAsync = createAsyncThunk(
    "invite/sendInviteAsync",
    async (_, thunkApi) => {
        const state = (thunkApi.getState() as RootState).invites;

        const response = await afetch(
            `https://local.api.letun:8080/invites/send`,
            {
                method: "POST",
                body: JSON.stringify({
                    email: state.inviteUser.email,
                    roleCode: state.inviteUser.role,
                }),
            }
        );

        if (response?.status != 200) {
            const error = (await response?.text())?.trim();

            switch (error) {
                case "user-exists-with-email":
                    return thunkApi.rejectWithValue(
                        "User with this email already exists"
                    );
                case "invite-exists-with-email":
                    return thunkApi.rejectWithValue(
                        "Invite with this email already exists"
                    );
                case "invalid-role-code":
                    return thunkApi.rejectWithValue("Invalid role code");
                default:
                    return thunkApi.rejectWithValue("Unknown error");
            }
        }


        const params = getInviteParams(state);
        const list = await fetchInvitesList(params);

        return thunkApi.fulfillWithValue(list);
    }
);

export const resendInviteAsync = createAsyncThunk(
    "invite/resendInviteAsync",
    async (payload: number, thunkApi) => {
        const response = await afetch(
            `https://local.api.letun:8080/invites/resend/${payload}`,
            {
                method: "POST",
            }
        );

        if (response?.status != 200) {
            thunkApi.rejectWithValue("Возникла error");
        }

        const state = (thunkApi.getState() as RootState).invites;
        const params = getInviteParams(state);
        const list = await fetchInvitesList(params);

        return thunkApi.fulfillWithValue(list);
    }
);

export const deleteInviteAsync = createAsyncThunk(
    "invite/deleteInviteAsync",
    async (payload: number, thunkApi) => {
        const response = await afetch(
            `https://local.api.letun:8080/invites/delete/${payload}`,
            {
                method: "DELETE",
            }
        );

        if (response?.status != 200) {
            return thunkApi.rejectWithValue("Возникла error");
        }

        const state = (thunkApi.getState() as RootState).invites;
        const params = getInviteParams(state);
        const list = await fetchInvitesList(params);

        return thunkApi.fulfillWithValue(list);
    }
);

export const invitesActions = invitesSlice.actions;

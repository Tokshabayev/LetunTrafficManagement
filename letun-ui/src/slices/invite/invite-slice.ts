import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InviteState, InviteType } from "./invite-state";
import { isPhoneValid } from "@/src/core/validators/phone-validator";
import { isPasswordValid } from "@/src/core/validators/password-validator";
import { isOtpValid } from "@/src/core/validators/otp-validator";
import { RootState } from "@/src/app-store";
import { storeTokens } from "@/src/core/session/session";

const initialInviteState: InviteState = <InviteState>{
    type: InviteType.init,
    token: "",
};

export const inviteSlice = createSlice({
    name: "invite",
    initialState: initialInviteState,
    reducers: {
        setPhone: (state, { payload }: PayloadAction<string>) => {
            if (state.type === InviteType.phone) {
                state.phone = payload;
                state.isStepValid = isPhoneValid(payload);
            }
        },

        otpBack: (state) => {
            state.type = InviteType.phone;
            state.isLoading = false;
            state.isStepValid = true;
        },

        setRequestError: (state, { payload }: PayloadAction<string>) => {
            state.requestError = payload;
        },

        setNewPassword: (state, { payload }: PayloadAction<string>) => {
            if (state.type === InviteType.newPassword) {
                state.password = payload;
                state.isStepValid =
                    isPasswordValid(payload) && payload == state.passwordConfirm;
            }
        },

        setNewPasswordConfirm: (state, { payload }: PayloadAction<string>) => {
            if (state.type === InviteType.newPassword) {
                state.passwordConfirm = payload;
                state.isStepValid =
                    isPasswordValid(payload) && payload == state.password;
            }
        },

        setOtp: (state, { payload }: PayloadAction<string>) => {
            if (state.type === InviteType.otp) {
                state.otp = payload;
                state.isStepValid = isOtpValid(payload);
            }
        },

        clear: (state) => {
            state.type = InviteType.init;
            state.token = "";
        },
    },
    extraReducers: (builder) => {

        builder.addCase(checkInviteTokenAsync.pending, (state) => {
            state.isLoading = true;
            state.type = InviteType.init;
        });

        builder.addCase(checkInviteTokenAsync.fulfilled, (state, action) => {
            if (action.payload) {
                state.type = InviteType.phone;
                state.token = action.payload! as string;
                state.isLoading = false;
            } else {
                state.type = InviteType.checkFailed;
            }
        });

        builder.addCase(checkInviteTokenAsync.rejected, (state, action) => {
            state.type = InviteType.checkFailed;
            state.requestError = (action.payload as string) || "Unknown error";
            state.isLoading = false;
        });

        // Phone
        builder.addCase(submitInvitePhoneAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(submitInvitePhoneAsync.fulfilled, (state) => {
            state.type = InviteType.otp;
            state.isLoading = false;
            state.isStepValid = false;
            state.requestError = "";
            if (state.type === InviteType.otp) {
                state.otp = "";
            }
        });

        builder.addCase(submitInvitePhoneAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.requestError = (action.payload as string) || "Unknown error";
        });

        // OTP

        builder.addCase(submitInviteOtpAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(submitInviteOtpAsync.fulfilled, (state, action) => {
            const payload = action.payload as LoginOtpResp;
            if (payload.passwordRequired === true) {
                state.type = InviteType.newPassword;
            } else if (payload.accessToken != undefined) {
                state.type = InviteType.success;
            }

            if (
                state.type == InviteType.newPassword
            ) {
                state.passwordToken = payload.passwordLoginToken!;
            }

            state.isLoading = false;
            state.requestError = "";
        });

        builder.addCase(submitInviteOtpAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.requestError = (action.payload as string) || "Unknown error";
        });

        // Password Verify
        builder.addCase(submitInvitePasswordAsync.pending, (state) => {
            state.isLoading = true;
        });

        builder.addCase(submitInvitePasswordAsync.fulfilled, (state) => {
            state.type = InviteType.success;
            state.isLoading = false;
        });

        builder.addCase(submitInvitePasswordAsync.rejected, (state, action) => {
            state.isLoading = false;
            state.requestError = (action.payload as string) || "Unknown error";
        });
    },
});

export const checkInviteTokenAsync = createAsyncThunk(
    "invite/checkInviteTokenAsync",
    async (payload: string, thunkApi) => {

        const response = await fetch(
            `https://local.api.letun:8080/invites/check/${payload}`,
            {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.status != 200) {
            const text = (await response.text()).trim();

            switch (text) {
                case "invalid-request-data":
                case "invalid-token":
                    return thunkApi.rejectWithValue("Invalid data");
                case "invite-already-used":
                    return thunkApi.rejectWithValue("Invitation already used");
                case "invite-not-found":
                    return thunkApi.rejectWithValue("Invitation not found");
                case "invite-expired":
                    return thunkApi.rejectWithValue("Invitation expired");
            }

            return thunkApi.rejectWithValue("Unknown error");
        }

        return thunkApi.fulfillWithValue(payload);
    }
);

export const submitInvitePhoneAsync = createAsyncThunk(
    "invite/submitInvitePhoneAsync",
    async (_, thunkApi) => {
        const state = (thunkApi.getState() as RootState).invite;
        if (!state.isStepValid && state.type !== InviteType.otp) {
            return thunkApi.rejectWithValue("type reject");
        }

        if (state.type !== InviteType.phone && state.type !== InviteType.otp) {
            return thunkApi.rejectWithValue("type reject");
        }

        const phone = state.phone;

        const response = await fetch(
            "https://local.api.letun:8080/invites/sendOtp",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: state.token, phoneNumber: phone }),
            }
        );

        if (response.status != 200) {
            const text = (await response.text()).trim();

            switch (text) {
                case "too-many-requests":
                    return thunkApi.rejectWithValue("Too many requests");
                case "invalid-phone-format":
                    return thunkApi.rejectWithValue("Invalid phone number");
                case "user-exists-with-phone-number":
                    return thunkApi.rejectWithValue("User with this phone number already exists");
            }

            return thunkApi.rejectWithValue("Unknown error");
        }
    }
);

export const submitInviteOtpAsync = createAsyncThunk(
    "invite/submitInviteOtpAsync",
    async (_, thunkApi) => {

        const state = (thunkApi.getState() as RootState).invite;

        if (!state.isStepValid) {
            return thunkApi.rejectWithValue("type reject");
        }

        if (state.type !== InviteType.otp) {
            return thunkApi.rejectWithValue("type reject");
        }

        const response = await fetch(
            "https://local.api.letun:8080/invites/loginOtp",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token: state.token, code: state.otp }),
            }
        );

        if (response.status != 200) {
            const text = (await response.text()).trim();

            switch (text) {
                case "invalid-request-data":
                case "invalid-token":
                    return thunkApi.rejectWithValue("Invalid data");
                case "invite-already-used":
                    return thunkApi.rejectWithValue("Invitation already used");
                case "invite-not-found":
                    return thunkApi.rejectWithValue("Invitation not found");
                case "invite-expired":
                    return thunkApi.rejectWithValue("Invitation expired");
                case "user-exists-with-phone-number":
                    return thunkApi.rejectWithValue("User with this phone number already exists");
                case "invalid-otp-code":
                    return thunkApi.rejectWithValue("Invalid OTP code");
                case "otp-login-timeout":
                    return thunkApi.rejectWithValue("Invalid OTP code");
                case "otp-not-sent":
                    return thunkApi.rejectWithValue("OTP not sent");
                case "too-many-requests":
                    return thunkApi.rejectWithValue("Too many requests");
            }

            return thunkApi.rejectWithValue(text ?? "Unknown error");
        }

        const json = await response.json();

        const resp = json as LoginOtpResp;

        const hasTokens =
            resp.accessToken != undefined &&
            resp.refreshToken != undefined &&
            resp.accessTokenExpireDate != undefined &&
            resp.refreshTokenExpireDate != undefined;

        if (hasTokens) {
            await storeTokens({
                accessToken: resp.accessToken!,
                accessTokenExpireDate: resp.accessTokenExpireDate!,
                refreshToken: resp.refreshToken!,
                refreshTokenExpireDate: resp.refreshTokenExpireDate!,
            });
        }

        return thunkApi.fulfillWithValue(resp);
    }
);

export const submitInvitePasswordAsync = createAsyncThunk(
    "invite/submitInvitePasswordAsync",
    async (_, thunkApi) => {
        const state = (thunkApi.getState() as RootState).invite;
        if (!state.isStepValid) {
            return thunkApi.rejectWithValue("type reject");
        }

        if (state.type !== InviteType.newPassword) {
            return thunkApi.rejectWithValue("type reject");
        }

        const password = state.password;

        const response = await fetch(
            "https://local.api.letun:8080/auth/passwordVerify",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: password,
                    passwordLoginToken: state.passwordToken,
                }),
            }
        );

        if (response.status != 200) {
            const text = (await response.text()).trim();

            switch (text) {
                case "too-many-requests":
                    return thunkApi.rejectWithValue("Too many requests");
                case "verify-timeout":
                    return thunkApi.rejectWithValue("Password verify timeout");
            }

            return thunkApi.rejectWithValue(text ?? "Unknown error");
        }

        const json = await response.json();
        const resp = json as LoginOtpResp;

        if (resp.user != undefined) {
            if (resp.user.roleCode === "user") {
                return thunkApi.rejectWithValue("User not found");
            }
        }

        if (
            resp.accessToken != undefined &&
            resp.refreshToken != undefined &&
            resp.accessTokenExpireDate != undefined &&
            resp.refreshTokenExpireDate != undefined
        ) {
            await storeTokens({
                accessToken: resp.accessToken,
                accessTokenExpireDate: resp.accessTokenExpireDate,
                refreshToken: resp.refreshToken,
                refreshTokenExpireDate: resp.refreshTokenExpireDate,
            });

            return thunkApi.fulfillWithValue(resp);
        }

        return thunkApi.rejectWithValue("Unknown error");
    }
);

export const inviteActions = inviteSlice.actions;

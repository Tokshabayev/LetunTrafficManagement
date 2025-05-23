import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoginState, LoginType } from "./login-state";
import { isPhoneValid } from "@/src/core/validators/phone-validator";
import { isPasswordValid } from "@/src/core/validators/password-validator";
import { isOtpValid } from "@/src/core/validators/otp-validator";
import { RootState } from "@/src/app-store";
import { storeTokens } from "@/src/core/session/session";
import { isEmailValid } from "@/src/core/validators/email-validator";

const initialLoginState: LoginState = <LoginState>{
  type: LoginType.phone,
};

export const loginSlice = createSlice({
  name: "login",
  initialState: initialLoginState,
  reducers: {
    setPhoneType: (state) => {
      state.type = LoginType.phone;
    },

    setEmailType: (state) => {
      state.type = LoginType.email;
    },

    setPhone: (state, { payload }: PayloadAction<string>) => {
      if (state.type === LoginType.phone) {
        state.phone = payload;
        state.isStepValid = isPhoneValid(payload);
      }
    },

    setEmail: (state, { payload }: PayloadAction<string>) => {
      if (state.type === LoginType.email) {
        state.email = payload;
        state.isStepValid = isEmailValid(payload);
      }
    },

    otpBack: (state) => {
      state.type = LoginType.phone;
      state.isLoading = false;
      state.isStepValid = true;
    },

    setRequestError: (state, { payload }: PayloadAction<string>) => {
      state.requestError = payload;
    },

    setPassword: (state, { payload }: PayloadAction<string>) => {
      if (state.type === LoginType.passwordVerify) {
        state.password = payload;
        state.isStepValid = payload.length > 0;
      }
    },

    setNewPassword: (state, { payload }: PayloadAction<string>) => {
      if (state.type === LoginType.newPassword) {
        state.password = payload;
        state.isStepValid =
          isPasswordValid(payload) && payload == state.passwordConfirm;
      }
    },

    setNewPasswordConfirm: (state, { payload }: PayloadAction<string>) => {
      if (state.type === LoginType.newPassword) {
        state.passwordConfirm = payload;
        state.isStepValid =
          isPasswordValid(payload) && payload == state.password;
      }
    },

    setOtp: (state, { payload }: PayloadAction<string>) => {
      if (state.type === LoginType.otp) {
        state.otp = payload;
        state.isStepValid = isOtpValid(payload);
      }
    },
  },
  extraReducers: (builder) => {
    // Email
    builder.addCase(submitEmailAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(submitEmailAsync.fulfilled, (state) => {
      state.type = LoginType.otp;
      state.isLoading = false;
      state.isStepValid = false;
      state.requestError = "";
      if (state.type === LoginType.otp) {
        state.otp = "";
        state.phone = undefined;
      }
    });

    builder.addCase(submitEmailAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.requestError = (action.payload as string) || "Unknown error";
    });

    // Phone
    builder.addCase(submitPhoneAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(submitPhoneAsync.fulfilled, (state) => {
      state.type = LoginType.otp;
      state.isLoading = false;
      state.isStepValid = false;
      state.requestError = "";
      if (state.type === LoginType.otp) {
        state.otp = "";
        state.email = undefined;
      }
    });

    builder.addCase(submitPhoneAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.requestError = (action.payload as string) || "Unknown error";
    });

    // OTP

    builder.addCase(submitOtpAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(submitOtpAsync.fulfilled, (state, action) => {
      const payload = action.payload as LoginOtpResp;
      if (payload.passwordRequired === true) {
        if (payload.newPassword) {
          state.type = LoginType.newPassword;
        } else {
          state.type = LoginType.passwordVerify;
        }
      } else if (payload.accessToken != undefined) {
        state.type = LoginType.success;
      }

      if (
        state.type == LoginType.newPassword ||
        state.type == LoginType.passwordVerify
      ) {
        state.passwordToken = payload.passwordLoginToken!;
      }

      state.isLoading = false;
      state.requestError = "";
    });

    builder.addCase(submitOtpAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.requestError = (action.payload as string) || "Unknown error";
    });

    // Password Verify
    builder.addCase(submitPasswordAsync.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(submitPasswordAsync.fulfilled, (state) => {
      state.type = LoginType.success;
      state.isLoading = false;
    });

    builder.addCase(submitPasswordAsync.rejected, (state, action) => {
      state.isLoading = false;
      state.requestError = (action.payload as string) || "Unknown error";
    });
  },
});

export const submitEmailAsync = createAsyncThunk(
  "login/submitEmailAsync",
  async (_, thunkApi) => {
    const state = (thunkApi.getState() as RootState).login;
    if (!state.isStepValid && state.type !== LoginType.otp) {
      return thunkApi.rejectWithValue("type reject");
    }

    if (state.type !== LoginType.email && state.type !== LoginType.otp) {
      return thunkApi.rejectWithValue("type reject");
    }

    const email = state.email;

    const response = await fetch(
      "https://local.api.letun:8080/auth/sendEmailOtp",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      }
    );

    if (response.status != 200) {
      const text = (await response.text()).trim();

      switch (text) {
        case "too-many-requests":
          return thunkApi.rejectWithValue("Too many requests");
        case "invalid-phone-format":
          return thunkApi.rejectWithValue("Invalid phone number");
        case "user-is-blocked":
          return thunkApi.rejectWithValue("User is blocked");
      }

      return thunkApi.rejectWithValue("Unknown error");
    }
  }
);

export const submitPhoneAsync = createAsyncThunk(
  "login/submitPhoneAsync",
  async (_, thunkApi) => {
    const state = (thunkApi.getState() as RootState).login;
    if (!state.isStepValid && state.type !== LoginType.otp) {
      return thunkApi.rejectWithValue("type reject");
    }

    if (state.type !== LoginType.phone && state.type !== LoginType.otp) {
      return thunkApi.rejectWithValue("type reject");
    }

    const phone = state.phone;

    const response = await fetch(
      "https://local.api.letun:8080/auth/sendOtp",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: phone }),
      }
    );

    if (response.status != 200) {
      const text = (await response.text()).trim();

      switch (text) {
        case "too-many-requests":
          return thunkApi.rejectWithValue("Too many requests");
        case "invalid-phone-format":
          return thunkApi.rejectWithValue("Invalid phone number");
        case "user-is-blocked":
          return thunkApi.rejectWithValue("User is blocked");
      }

      return thunkApi.rejectWithValue("Unknown error");
    }
  }
);

export const submitOtpAsync = createAsyncThunk(
  "login/submitOtpAsync",
  async (_, thunkApi) => {
    const state = (thunkApi.getState() as RootState).login;

    if (!state.isStepValid) {
      return thunkApi.rejectWithValue("type reject");
    }

    if (state.type !== LoginType.otp) {
      return thunkApi.rejectWithValue("type reject");
    }

    const phone = state.phone;
    const email = state.email;
    const otp = state.otp;

    const response = await fetch(
      phone ? "https://local.api.letun:8080/auth/loginOtp" : "https://local.api.letun:8080/auth/loginEmailOtp",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: phone ? JSON.stringify({ phoneNumber: phone, code: otp }) : JSON.stringify({ email: email, code: otp }),
      }
    );

    if (response.status != 200) {
      const text = (await response.text()).trim();
      console.warn("[submitOtpAsync] Response error text:", text);

      switch (text) {
        case "too-many-requests":
          return thunkApi.rejectWithValue("Too many requests");
        case "otp-not-sent":
          return thunkApi.rejectWithValue("Otp code not sent");
        case "invalid-otp-code":
          return thunkApi.rejectWithValue("Invalid otp code");
        case "user-is-blocked":
          return thunkApi.rejectWithValue("User is blocked");
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

export const submitPasswordAsync = createAsyncThunk(
  "login/submitPasswordAsync",
  async (_, thunkApi) => {
    const state = (thunkApi.getState() as RootState).login;
    if (!state.isStepValid) {
      return thunkApi.rejectWithValue("type reject");
    }

    if (
      state.type !== LoginType.passwordVerify &&
      state.type !== LoginType.newPassword
    ) {
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

export const loginActions = loginSlice.actions;

export enum LoginType {
  phone,
  email,
  passwordVerify,
  newPassword,
  otp,
  success,
}

interface ILoginState {
  type: LoginType;
  isLoading: boolean;
  requestError?: string | undefined;
  isStepValid: boolean;
}

export interface LoginPhoneState extends ILoginState {
  type: LoginType.phone;
  phone?: string | undefined;
}

export interface LoginEmailState extends ILoginState {
  type: LoginType.email;
  email?: string | undefined;
}

export interface LoginOtpState extends ILoginState {
  type: LoginType.otp;
  otp?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
}

export interface LoginPasswordVerifyState extends ILoginState {
  type: LoginType.passwordVerify;
  password?: string | undefined;
  passwordToken: string;
}

export interface LoginNewPasswordState extends ILoginState {
  type: LoginType.newPassword;
  password?: string | undefined;
  passwordConfirm?: string | undefined;
  passwordToken: string;
}

export interface LoginSuccessState extends ILoginState {
  type: LoginType.success;
}

export type LoginState =
  | LoginPhoneState
  | LoginEmailState
  | LoginPasswordVerifyState
  | LoginNewPasswordState
  | LoginOtpState
  | LoginSuccessState;

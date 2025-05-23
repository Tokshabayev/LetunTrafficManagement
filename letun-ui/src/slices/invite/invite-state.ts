export enum InviteType {
    init,
    checkFailed,
    phone,
    newPassword,
    otp,
    success,
}

interface IInviteState {
    type: InviteType;
    isLoading: boolean;
    requestError?: string | undefined;
    isStepValid: boolean;
    token: string;
}

export interface InviteInitState extends IInviteState {
    type: InviteType.init;
}

export interface InviteCheckFailedState extends IInviteState {
    type: InviteType.checkFailed;
}

export interface InvitePhoneState extends IInviteState {
    type: InviteType.phone;
    phone?: string | undefined;
}

export interface InviteOtpState extends IInviteState {
    type: InviteType.otp;
    otp?: string | undefined;
    phone: string;
}

export interface InviteNewPasswordState extends IInviteState {
    type: InviteType.newPassword;
    password?: string | undefined;
    passwordConfirm?: string | undefined;
    passwordToken: string;
}

export interface InviteSuccessState extends IInviteState {
    type: InviteType.success;
}

export type InviteState =
    | InviteInitState
    | InviteCheckFailedState
    | InvitePhoneState
    | InviteNewPasswordState
    | InviteOtpState
    | InviteSuccessState;

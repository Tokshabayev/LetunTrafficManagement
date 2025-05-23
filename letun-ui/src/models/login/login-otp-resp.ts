interface LoginOtpResp {
    passwordRequired: boolean | undefined;
    newPassword: boolean | undefined
    passwordLoginToken: string | undefined
    user: User | undefined
    accessToken: string | undefined
    accessTokenExpireDate: string | undefined
    refreshToken: string | undefined
    refreshTokenExpireDate: string | undefined
}
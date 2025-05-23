const otpRegex: RegExp = /^\d{6}$/;

export const isOtpValid = (otp: string): boolean => {
    return otpRegex.test(otp);
};

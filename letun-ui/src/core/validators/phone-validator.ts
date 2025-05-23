const phoneRegex: RegExp = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

export const isPhoneValid = (phone: string): boolean => {
    return phoneRegex.test(phone);
};

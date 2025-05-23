import { format } from "@react-input/mask";

export const formatPhoneNumberOptions = {
    mask: "+7 (7__) ___-__-__",
    replacement: { _: /\d/ },
}

 const _formatPhoneNumberOptions = {
    mask: "+_ (___) ___-__-__",
    replacement: { _: /\d/},
}


export const formatPhoneNumber = (phoneNumber: string) => { 
    return format(phoneNumber, _formatPhoneNumberOptions);
}
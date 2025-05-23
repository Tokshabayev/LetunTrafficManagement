package auth

type LoginOtpRequestDto struct {
	PhoneNumber string `json:"phoneNumber"`
	Code        string `json:"code"`
}

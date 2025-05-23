package auth

type LoginEmailOtpRequestDto struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

package auth

type PasswordVerifyRequestDto struct {
	Password           string `json:"password"`
	PasswordLoginToken string `json:"passwordLoginToken"`
}

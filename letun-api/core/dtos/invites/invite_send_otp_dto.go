package invites

type InviteSendOtpDto struct {
	Token       string `json:"token"`
	PhoneNumber string `json:"phoneNumber"`
}

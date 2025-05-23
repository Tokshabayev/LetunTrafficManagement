package invites

type InviteLoginDto struct {
	Token string `json:"token"`
	Code  string `json:"code"`
}

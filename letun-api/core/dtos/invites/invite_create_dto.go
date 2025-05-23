package invites

type InviteCreateDto struct {
	Email    string `json:"email"`
	RoleCode string `json:"roleCode"`
}

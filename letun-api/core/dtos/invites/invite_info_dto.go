package invites

type InviteInfoDto struct {
	Id        int    `json:"id"`
	Email     string `json:"email"`
	RoleCode  string `json:"roleCode"`
	CreatedAt string `json:"createdAt"`
	IsExpired bool   `json:"isExpired"`
	IsUsed    bool   `json:"isUsed"`
}

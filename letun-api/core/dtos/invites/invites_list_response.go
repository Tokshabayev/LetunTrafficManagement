package invites

type InvitesListResponseDto struct {
	Invites []InviteInfoDto `json:"invites"`
	MaxPage int             `json:"maxPage"`
	Total   int             `json:"total"`
}

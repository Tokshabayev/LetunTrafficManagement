package users

type UsersListResponseDto struct {
	Users   []UserInfoDto `json:"users"`
	MaxPage int           `json:"maxPage"`
	Total   int           `json:"total"`
}

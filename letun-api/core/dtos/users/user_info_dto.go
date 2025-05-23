package users

type UserInfoDto struct {
	Id          int    `json:"id"`
	Name        string `json:"name"`
	PhoneNumber string `json:"phoneNumber"`
	Email       string `json:"email"`
	RoleCode    string `json:"roleCode"`
	RoleId      int    `json:"roleId"`
	IsActive    bool   `json:"isActive"`
}

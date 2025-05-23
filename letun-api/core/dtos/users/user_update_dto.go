package users

type UserUpdateDto struct {
	Id          int    `json:"id"`
	Name        string `json:"name"`
	PhoneNumber string `json:"phoneNumber"`
	Email       string `json:"email"`
	RoleCode    string `json:"roleCode"`
}

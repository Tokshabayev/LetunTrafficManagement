package users

type UserCreateDto struct {
	Name        string `json:"name"`
	PhoneNumber string `json:"phoneNumber"`
	Email       string `json:"email"`
	RoleCode    string `json:"roleCode"`
}

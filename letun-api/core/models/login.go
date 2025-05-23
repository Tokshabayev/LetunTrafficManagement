package models

type Login struct {
	Id               int
	UserId           int
	AccessTokenHash  string
	RefreshTokenHash string
}

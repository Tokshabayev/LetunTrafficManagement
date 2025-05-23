package models

import "time"

type Invite struct {
	Id             int
	Email          string
	TokenHash      string
	RoleId         int
	CreatedAt      time.Time
	ExpirationDate time.Time
	IsUsed         bool
	OtpCodeId      *int
}

package models

import "time"

type User struct {
	Id           int
	Name         string `gorm:"column:username"`
	PasswordHash string
	PhoneNumber  string
	Email        string
	UpdatedAt    time.Time
	CreatedAt    time.Time
	RoleId       int
	IsActive     bool
}

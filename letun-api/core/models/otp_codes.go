package models

import "time"

type OTPCode struct {
	Id                         int
	Code                       string
	LastSendTryAt              time.Time
	PhoneNumber                string
	Email                      string
	SendOtpTriesCounted        int
	LoginOtpTriesCounted       int
	PasswordLoginTokenHash     string
	PasswordVerifyTriesCounted int
	IsProcessed                bool
}

func (OTPCode) TableName() string {
	return "otp_codes"
}

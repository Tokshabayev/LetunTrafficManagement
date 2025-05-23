package jwtx

import (
	"errors"
	"letun-api/core/crypto"
	"time"
)

type PassowrdVerifyJWT struct{}

type PasswordVerifyClaims struct {
	OtpCodeId   int
	NewPassword bool
	ExpireAt    time.Time
}

func (a *PassowrdVerifyJWT) GenerateToken(claims PasswordVerifyClaims) (string, error) {
	token, err := crypto.CreateToken(crypto.GenericClaims{
		Payload: map[string]interface{}{
			"otpCodeId":   claims.OtpCodeId,
			"newPassword": claims.NewPassword,
		},
		ExpireAt: claims.ExpireAt,
	})
	if err != nil {
		return "", err
	}
	return token, nil
}

func (a *PassowrdVerifyJWT) ExtractClaims(tokenStr string) (PasswordVerifyClaims, error) {
	claims, err := crypto.ExtractToken(tokenStr)
	if err != nil {
		return PasswordVerifyClaims{}, err
	}

	otpCodeId, ok1 := claims.Payload["otpCodeId"].(float64)
	newPassword, ok2 := claims.Payload["newPassword"].(bool)
	if !ok1 || !ok2 {
		return PasswordVerifyClaims{}, errors.New("invalid token claims structure")
	}

	return PasswordVerifyClaims{
		OtpCodeId:   int(otpCodeId),
		NewPassword: newPassword,
		ExpireAt:    claims.ExpireAt,
	}, nil
}

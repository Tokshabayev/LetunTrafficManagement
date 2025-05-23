package jwtx

import (
	"errors"
	"letun-api/core/crypto"
	"time"
)

type AuthJWT struct{}

type AuthClaims struct {
	LoginId  int
	UserId   int
	RoleCode string
	ExpireAt time.Time
}

func (a *AuthJWT) GenerateToken(claims AuthClaims) (string, error) {
	token, err := crypto.CreateToken(crypto.GenericClaims{
		Payload: map[string]interface{}{
			"logId": claims.LoginId,
			"usrId": claims.UserId,
			"role":  claims.RoleCode,
		},
		ExpireAt: claims.ExpireAt,
	})
	if err != nil {
		return "", err
	}
	return token, nil
}

func (a *AuthJWT) ExtractClaims(tokenStr string) (AuthClaims, error) {
	claims, err := crypto.ExtractToken(tokenStr)
	if err != nil {
		return AuthClaims{}, err
	}

	loginIdF, ok1 := claims.Payload["logId"].(float64)
	userIdF, ok2 := claims.Payload["usrId"].(float64)
	roleCode, ok3 := claims.Payload["role"].(string)

	if !ok1 || !ok2 || !ok3 {
		return AuthClaims{}, errors.New("invalid token claims structure")
	}

	return AuthClaims{
		LoginId:  int(loginIdF),
		UserId:   int(userIdF),
		RoleCode: roleCode,
		ExpireAt: claims.ExpireAt,
	}, nil
}

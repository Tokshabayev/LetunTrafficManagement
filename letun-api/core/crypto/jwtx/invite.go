package jwtx

import (
	"errors"
	"letun-api/core/crypto"
	"time"
)

type InviteJWT struct{}

type InviteClaims struct {
	InviteId int
	ExpireAt time.Time
}

func (a *InviteJWT) GenerateToken(claims InviteClaims) (string, error) {
	token, err := crypto.CreateToken(crypto.GenericClaims{
		Payload: map[string]interface{}{
			"invId": claims.InviteId,
		},
		ExpireAt: claims.ExpireAt,
	})
	if err != nil {
		return "", err
	}
	return token, nil
}

func (a *InviteJWT) ExtractClaims(tokenStr string) (InviteClaims, error) {
	claims, err := crypto.ExtractToken(tokenStr)
	if err != nil {
		return InviteClaims{}, err
	}

	inviteId, ok1 := claims.Payload["invId"].(float64)

	if !ok1 {
		return InviteClaims{}, errors.New("invalid token claims structure")
	}

	return InviteClaims{
		InviteId: int(inviteId),
		ExpireAt: claims.ExpireAt,
	}, nil
}

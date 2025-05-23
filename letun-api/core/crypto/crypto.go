package crypto

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"letun-api/core/config"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func HashPassword(value string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(value), bcrypt.DefaultCost)
	return string(hash), err
}

func CompareHashAndPassword(hash string, value string) error {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(value))
	return err
}

func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func CompareHashAndToken(hashed string, token string) bool {
	return hashed == HashToken(token)
}

var secretKey []byte

var ErrTokenInvalid = errors.New("token is invalid")

type GenericClaims struct {
	Payload  map[string]interface{}
	ExpireAt time.Time
}

func CreateToken(claims GenericClaims) (string, error) {
	sErr := manageSecretKey()
	if sErr != nil {
		return "", sErr
	}

	if secretKey == nil {
		return "", errors.New("secret key not set")
	}

	mapClaims := jwt.MapClaims{}
	for k, v := range claims.Payload {
		mapClaims[k] = v
	}
	mapClaims["exp"] = claims.ExpireAt.Unix()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, mapClaims)
	return token.SignedString(secretKey)
}

func ExtractToken(tokenString string) (GenericClaims, error) {
	sErr := manageSecretKey()
	if sErr != nil {
		return GenericClaims{}, sErr
	}

	if secretKey == nil {
		return GenericClaims{}, errors.New("secret key not set")
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return secretKey, nil
	})
	if err != nil || !token.Valid {
		return GenericClaims{}, ErrTokenInvalid
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return GenericClaims{}, errors.New("cannot cast claims")
	}

	payload := make(map[string]interface{})
	var expireAt time.Time

	for k, v := range mapClaims {
		if k == "exp" {
			if ts, ok := v.(float64); ok {
				expireAt = time.Unix(int64(ts), 0)
			}
		} else {
			payload[k] = v
		}
	}

	return GenericClaims{
		Payload:  payload,
		ExpireAt: expireAt,
	}, nil
}

func GenerateRandToken(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func manageSecretKey() error {
	if len(secretKey) == 0 {
		key := config.GetVal("SecretKey")
		if key == "" {
			return fmt.Errorf("no secret key defined")
		} else {
			secretKey = []byte(key)
		}
	}

	return nil
}

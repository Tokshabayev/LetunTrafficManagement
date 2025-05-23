package middlewares

import (
	"context"
	"letun-api/core/crypto/jwtx"
	"letun-api/core/repos"
	"net/http"
	"slices"
	"strings"
	"time"
)

const userIdKey string = "userId"
const roleCodeKey string = "roleCode"
const loginIdKey string = "loginId"

func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			next.ServeHTTP(w, r)
			return
		}

		token := parts[1]

		authJWT := jwtx.AuthJWT{}
		login, cErr := authJWT.ExtractClaims(token)

		if cErr != nil || login.UserId == 0 {
			next.ServeHTTP(w, r)
			return
		}

		authRepo := repos.AuthRepo{}
		if authRepo.IsUserBlocked(login.UserId) {
			http.Error(w, "User is blocked", http.StatusUnauthorized)
			return
		}

		now := time.Now().UTC()
		if now.After(login.ExpireAt) {
			next.ServeHTTP(w, r)
			return
		}

		ctx := context.WithValue(r.Context(), userIdKey, login.UserId)
		ctx = context.WithValue(ctx, roleCodeKey, login.RoleCode)
		ctx = context.WithValue(ctx, loginIdKey, login.LoginId)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AuthRequired(handler http.HandlerFunc, roles ...string) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		_, userOk := GetUserIdFromContext(r.Context())
		if !userOk {
			http.Error(w, "Auth required", http.StatusUnauthorized)
			return
		}

		if len(roles) > 0 {
			role, roleOk := GetRoleCodeFromContext(r.Context())
			if !roleOk {
				http.Error(w, "Internal Server Error", http.StatusUnauthorized)
				return
			}

			if !slices.Contains(roles, role) {
				http.Error(w, "Permission Denied", http.StatusUnauthorized)
				return
			}
		}

		handler.ServeHTTP(w, r)
	})
}

func GetUserIdFromContext(ctx context.Context) (int, bool) {
	userID, ok := ctx.Value(userIdKey).(int)
	return userID, ok
}

func GetRoleCodeFromContext(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(roleCodeKey).(string)
	return role, ok
}

func GetLoginIdFromContext(ctx context.Context) (int, bool) {
	loginId, ok := ctx.Value(loginIdKey).(int)
	return loginId, ok
}

package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"letun-api/core/crypto"
	"letun-api/core/crypto/jwtx"
	"letun-api/core/dtos/auth"
	"letun-api/core/dtos/users"
	"letun-api/core/middlewares"
	"letun-api/core/models"
	"letun-api/core/repos"
	"letun-api/core/utils"
	"letun-api/core/utils/validators"
)

type AuthHandler struct{}

func (h *AuthHandler) SendOtp(w http.ResponseWriter, r *http.Request) {
	var dto auth.SendOtpRequestDto
	err := utils.GetBody(r, &dto)

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	normalizedPhone, err := validators.ValidatePhoneNumber(dto.PhoneNumber, "KZ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	usersRepo := repos.UsersRepo{}
	userModel, _ := usersRepo.GetUserByPhoneNumber(normalizedPhone)

	if userModel.Id == 0 {
		http.Error(w, "user-not-found", http.StatusNotFound)
		return
	}

	if !userModel.IsActive {
		http.Error(w, "user-is-blocked", http.StatusBadRequest)
		return
	}

	// TODO: send OTP
	authRepo := repos.AuthRepo{}
	otpModel, _ := authRepo.GetOtpCodeByPhoneNumber(normalizedPhone)

	if otpModel.Id == 0 {
		go authRepo.CreateOtpCode(&models.OTPCode{
			Email:                      "",
			PhoneNumber:                normalizedPhone,
			Code:                       "123123",
			LastSendTryAt:              time.Now().UTC(),
			SendOtpTriesCounted:        0,
			LoginOtpTriesCounted:       0,
			PasswordLoginTokenHash:     "",
			PasswordVerifyTriesCounted: 0,
			IsProcessed:                false,
		})
		w.WriteHeader(http.StatusOK)
		return
	}

	now := time.Now().UTC()
	sendDuration := now.Sub(otpModel.LastSendTryAt)
	hours := sendDuration.Hours()
	if hours > 1 {
		otpModel.SendOtpTriesCounted = 0
	} else if otpModel.SendOtpTriesCounted >= 5 {
		http.Error(w, "too-many-requests", http.StatusTooManyRequests)
		return
	}

	go authRepo.UpdateOtpCode(&models.OTPCode{
		Id:                         otpModel.Id,
		Code:                       "123123",
		LastSendTryAt:              now,
		SendOtpTriesCounted:        otpModel.SendOtpTriesCounted + 1,
		LoginOtpTriesCounted:       0,
		PasswordLoginTokenHash:     "",
		PasswordVerifyTriesCounted: 0,
		PhoneNumber:                normalizedPhone,
		IsProcessed:                false,
	})
}

func (h *AuthHandler) LoginOtp(w http.ResponseWriter, r *http.Request) {
	var dto auth.LoginOtpRequestDto
	err := utils.GetBody(r, &dto)

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	normalizedPhone, err := validators.ValidatePhoneNumber(dto.PhoneNumber, "US")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	authRepo := repos.AuthRepo{}
	otpModel, _ := authRepo.GetOtpCodeByPhoneNumber(normalizedPhone)

	// Existence check
	if otpModel.Id == 0 || otpModel.IsProcessed {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	// Processed check
	if otpModel.IsProcessed {
		http.Error(w, "otp-not-sent", http.StatusBadRequest)
		return
	}

	// Login tries check
	if otpModel.LoginOtpTriesCounted > 3 {
		http.Error(w, "too-many-requests", http.StatusTooManyRequests)
		return
	}

	// Timeout check
	now := time.Now().UTC()
	sendDuration := now.Sub(otpModel.LastSendTryAt)
	minutes := sendDuration.Minutes()

	if minutes > 10 {
		http.Error(w, "otp-login-timeout", http.StatusTooManyRequests)
		return
	}

	// OTP check
	if otpModel.Code != dto.Code {
		http.Error(w, "invalid-otp-code", http.StatusBadRequest)
		otpModel.LoginOtpTriesCounted++
		go authRepo.UpdateOtpCode(otpModel)
		return
	}

	userRepo := repos.UsersRepo{}
	userModel, _ := userRepo.GetUserByPhoneNumber(normalizedPhone)

	if userModel.Id == 0 {
		http.Error(w, "user-not-found", http.StatusNotFound)
		return
	}

	if !userModel.IsActive {
		http.Error(w, "user-is-blocked", http.StatusBadRequest)
		return
	}

	roleModel, _ := userRepo.GetRoleById(userModel.RoleId)

	if roleModel.PasswordRequired {
		w.Header().Set("Content-Type", "application/json")

		passwordJWT := jwtx.PassowrdVerifyJWT{}
		passwordToken, pswrdErr := passwordJWT.GenerateToken(jwtx.PasswordVerifyClaims{
			OtpCodeId:   otpModel.Id,
			NewPassword: userModel.PasswordHash == "",
			ExpireAt:    now.Add(15 * time.Minute),
		})

		if pswrdErr != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		if userModel.Id == 0 {
			now := time.Now().UTC()
			userModel := models.User{
				PhoneNumber: normalizedPhone,
				CreatedAt:   now,
				UpdatedAt:   now,
				RoleId:      roleModel.Id,
				IsActive:    true,
			}
			userRepo.CreateUser(&userModel)
		}

		json.NewEncoder(w).Encode(
			map[string]any{
				"passwordRequired":   true,
				"newPassword":        userModel.PasswordHash == "",
				"passwordLoginToken": passwordToken,
			},
		)

		passwordTokenHash := crypto.HashToken(passwordToken)
		otpModel.PasswordLoginTokenHash = passwordTokenHash
		go authRepo.UpdateOtpCode(otpModel)

		return
	}

	login, lErr := manageNewLogin(userModel, roleModel.Code, authRepo)
	if lErr != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	otpModel.IsProcessed = true
	go authRepo.UpdateOtpCode(otpModel)

	json.NewEncoder(w).Encode(login)
}

func (h *AuthHandler) SendEmailOtp(w http.ResponseWriter, r *http.Request) {
	var dto auth.SendEmailOtpRequestDto
	err := utils.GetBody(r, &dto)

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	usersRepo := repos.UsersRepo{}
	userModel, _ := usersRepo.GetUserByEmail(dto.Email)

	if userModel.Id == 0 {
		http.Error(w, "user-not-found", http.StatusNotFound)
		return
	}

	if !userModel.IsActive {
		http.Error(w, "user-is-blocked", http.StatusBadRequest)
		return
	}

	// TODO: send OTP
	authRepo := repos.AuthRepo{}
	otpModel, _ := authRepo.GetOtpCodeByEmail(dto.Email)

	if otpModel.Id == 0 {
		go authRepo.CreateOtpCode(&models.OTPCode{
			Email:                      dto.Email,
			PhoneNumber:                userModel.PhoneNumber,
			Code:                       "123123",
			LastSendTryAt:              time.Now().UTC(),
			SendOtpTriesCounted:        0,
			LoginOtpTriesCounted:       0,
			PasswordLoginTokenHash:     "",
			PasswordVerifyTriesCounted: 0,
			IsProcessed:                false,
		})
		w.WriteHeader(http.StatusOK)
		return
	}

	now := time.Now().UTC()
	sendDuration := now.Sub(otpModel.LastSendTryAt)
	hours := sendDuration.Hours()
	if hours > 1 {
		otpModel.SendOtpTriesCounted = 0
	} else if otpModel.SendOtpTriesCounted >= 5 {
		http.Error(w, "too-many-requests", http.StatusTooManyRequests)
		return
	}

	go authRepo.UpdateOtpCode(&models.OTPCode{
		Id:                         otpModel.Id,
		Code:                       "123123",
		LastSendTryAt:              now,
		SendOtpTriesCounted:        otpModel.SendOtpTriesCounted + 1,
		LoginOtpTriesCounted:       0,
		PasswordLoginTokenHash:     "",
		PasswordVerifyTriesCounted: 0,
		PhoneNumber:                otpModel.PhoneNumber,
		Email:                      dto.Email,
		IsProcessed:                false,
	})
}

func (h *AuthHandler) LoginEmailOtp(w http.ResponseWriter, r *http.Request) {
	var dto auth.LoginEmailOtpRequestDto
	err := utils.GetBody(r, &dto)

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	authRepo := repos.AuthRepo{}
	otpModel, _ := authRepo.GetOtpCodeByEmail(dto.Email)

	// Existence check
	if otpModel.Id == 0 || otpModel.IsProcessed {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	// Processed check
	if otpModel.IsProcessed {
		http.Error(w, "otp-not-sent", http.StatusBadRequest)
		return
	}

	// Login tries check
	if otpModel.LoginOtpTriesCounted > 3 {
		http.Error(w, "too-many-requests", http.StatusTooManyRequests)
		return
	}

	// Timeout check
	now := time.Now().UTC()
	sendDuration := now.Sub(otpModel.LastSendTryAt)
	minutes := sendDuration.Minutes()

	if minutes > 10 {
		http.Error(w, "otp-login-timeout", http.StatusTooManyRequests)
		return
	}

	// OTP check
	if otpModel.Code != dto.Code {
		http.Error(w, "invalid-otp-code", http.StatusBadRequest)
		otpModel.LoginOtpTriesCounted++
		go authRepo.UpdateOtpCode(otpModel)
		return
	}

	userRepo := repos.UsersRepo{}
	userModel, _ := userRepo.GetUserByPhoneNumber(otpModel.PhoneNumber)

	if userModel.Id == 0 {
		http.Error(w, "user-is-blocked", http.StatusBadRequest)
		return
	}

	if !userModel.IsActive {
		http.Error(w, "user-is-blocked", http.StatusBadRequest)
		return
	}

	roleModel, _ := userRepo.GetRoleById(userModel.RoleId)
	if userModel.Id == 0 {
		http.Error(w, "user-not-found", http.StatusNotFound)
	}

	if roleModel.PasswordRequired {
		w.Header().Set("Content-Type", "application/json")

		passwordJWT := jwtx.PassowrdVerifyJWT{}
		passwordToken, pswrdErr := passwordJWT.GenerateToken(jwtx.PasswordVerifyClaims{
			OtpCodeId:   otpModel.Id,
			NewPassword: userModel.PasswordHash == "",
			ExpireAt:    now.Add(15 * time.Minute),
		})

		if pswrdErr != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		if userModel.Id == 0 {
			now := time.Now().UTC()
			userModel := models.User{
				PhoneNumber: otpModel.PhoneNumber,
				CreatedAt:   now,
				UpdatedAt:   now,
				RoleId:      roleModel.Id,
				IsActive:    true,
			}
			userRepo.CreateUser(&userModel)
		}

		json.NewEncoder(w).Encode(
			map[string]any{
				"passwordRequired":   true,
				"newPassword":        userModel.PasswordHash == "",
				"passwordLoginToken": passwordToken,
			},
		)

		passwordTokenHash := crypto.HashToken(passwordToken)
		otpModel.PasswordLoginTokenHash = passwordTokenHash
		go authRepo.UpdateOtpCode(otpModel)

		return
	}

	login, lErr := manageNewLogin(userModel, roleModel.Code, authRepo)
	if lErr != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	otpModel.IsProcessed = true
	go authRepo.UpdateOtpCode(otpModel)

	json.NewEncoder(w).Encode(login)
}

func (h *AuthHandler) PasswordVerify(w http.ResponseWriter, r *http.Request) {
	var dto auth.PasswordVerifyRequestDto
	err := utils.GetBody(r, &dto)

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	passwordJWT := jwtx.PassowrdVerifyJWT{}
	claims, err := passwordJWT.ExtractClaims(dto.PasswordLoginToken)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC()
	if now.After(claims.ExpireAt) {
		http.Error(w, "verify-timeout", http.StatusTooManyRequests)
		return
	}

	authRepo := repos.AuthRepo{}
	otpModel, _ := authRepo.GetOtpCodeById(claims.OtpCodeId)

	// Existence check
	if otpModel.Id == 0 || otpModel.IsProcessed || otpModel.PasswordLoginTokenHash == "" {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	// Tries count check
	if otpModel.PasswordVerifyTriesCounted > 3 {
		http.Error(w, "too-many-requests", http.StatusTooManyRequests)
		return
	}

	// Timeout check
	sendDuration := now.Sub(otpModel.LastSendTryAt)
	minutes := sendDuration.Minutes()

	if minutes > 15 {
		http.Error(w, "verify-timeout", http.StatusTooManyRequests)
		return
	}

	// Token Check
	isTokenValid := crypto.CompareHashAndToken(otpModel.PasswordLoginTokenHash, dto.PasswordLoginToken)
	if !isTokenValid {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	userRepo := repos.UsersRepo{}
	user, _ := userRepo.GetUserByPhoneNumber(otpModel.PhoneNumber)
	if user.Id == 0 {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	if user.PasswordHash == "" {
		if len(dto.Password) < 6 {
			http.Error(w, "Invalid request data", http.StatusBadRequest)
			return
		}

		passwordHash, pswrdErr := crypto.HashPassword(dto.Password)
		if pswrdErr != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		user.PasswordHash = passwordHash
		go userRepo.UpdateUser(user)
	} else {
		pswrdErr := crypto.CompareHashAndPassword(user.PasswordHash, dto.Password)
		if pswrdErr != nil {
			http.Error(w, "Invalid request data", http.StatusBadRequest)

			otpModel.LoginOtpTriesCounted++
			go authRepo.UpdateOtpCode(otpModel)

			return
		}
	}

	role, roleErr := userRepo.GetRoleById(user.RoleId)
	if roleErr != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	login, lErr := manageNewLogin(user, role.Code, authRepo)
	if lErr != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	otpModel.IsProcessed = true
	go authRepo.UpdateOtpCode(otpModel)

	json.NewEncoder(w).Encode(login)
}

func manageNewLogin(user *models.User, roleCode string, authRepo repos.AuthRepo) (*map[string]any, error) {
	now := time.Now().UTC()
	accessTokenExpireDate := now.Add(30 * 24 * time.Hour)
	refreshTokenExpireDate := now.Add(30 * 24 * time.Hour)

	loginId, loginErr := authRepo.GetNewLoginId()

	if loginErr != nil {
		return nil, fmt.Errorf("error")
	}

	authJWT := jwtx.AuthJWT{}

	accessToken, aErr := authJWT.GenerateToken(jwtx.AuthClaims{
		LoginId:  loginId,
		UserId:   user.Id,
		RoleCode: roleCode,
		ExpireAt: accessTokenExpireDate,
	})

	if aErr != nil {
		return nil, fmt.Errorf("error")
	}

	accessTokenHash := crypto.HashToken(accessToken)

	refreshToken, rErr := authJWT.GenerateToken(jwtx.AuthClaims{
		LoginId:  loginId,
		UserId:   user.Id,
		RoleCode: roleCode,
		ExpireAt: refreshTokenExpireDate,
	})

	if rErr != nil {
		return nil, fmt.Errorf("error")
	}

	refreshTokenHash := crypto.HashToken(refreshToken)

	loginModel := models.Login{
		Id:               loginId,
		UserId:           user.Id,
		AccessTokenHash:  accessTokenHash,
		RefreshTokenHash: refreshTokenHash,
	}

	go authRepo.CreateLogin(&loginModel)

	return &map[string]any{
		"user": users.UserInfoDto{
			Id:       user.Id,
			Name:     user.Name,
			Email:    user.Email,
			RoleCode: roleCode,
			RoleId:   user.RoleId,
		},
		"accessToken":            accessToken,
		"accessTokenExpireDate":  accessTokenExpireDate.Format("2006-01-02 15:04:05"),
		"refreshToken":           refreshToken,
		"refreshTokenExpireDate": refreshTokenExpireDate.Format("2006-01-02 15:04:05"),
	}, nil
}

func (h *AuthHandler) RefreshAccessToken(w http.ResponseWriter, r *http.Request) {
	refreshToken := r.Header.Get("X-Refresh-Token")
	if refreshToken == "" {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	authJWT := jwtx.AuthJWT{}
	claims, err := authJWT.ExtractClaims(refreshToken)

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC()
	if now.After(claims.ExpireAt) {
		http.Error(w, "Token expired", http.StatusUnauthorized)
		return
	}

	accessTokenExpireDate := now.Add(30 * time.Minute)

	accessToken, err := authJWT.GenerateToken(jwtx.AuthClaims{
		LoginId:  claims.LoginId,
		UserId:   claims.UserId,
		RoleCode: claims.RoleCode,
		ExpireAt: accessTokenExpireDate,
	})

	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	accessTokenHash := crypto.HashToken(accessToken)

	authRepo := repos.AuthRepo{}
	loginModel, err := authRepo.GetLoginById(claims.LoginId)

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	loginModel.AccessTokenHash = accessTokenHash

	go authRepo.UpdateLogin(loginModel)

	resp := &map[string]string{
		"accessToken":           accessToken,
		"accessTokenExpireDate": accessTokenExpireDate.Format("2006-01-02 15:04:05"),
	}

	json.NewEncoder(w).Encode(resp)
}

func (h *AuthHandler) Check(w http.ResponseWriter, r *http.Request) {
	// var dto auth.PasswordVerifyDto
	// err := utils.GetBody(r, &dto)

	user, userOk := middlewares.GetUserIdFromContext(r.Context())
	role, roleOk := middlewares.GetRoleCodeFromContext(r.Context())

	if userOk {
		utils.Logger().Debug().Msg("Check USERNAME: " + strconv.Itoa(user))
	}

	if roleOk {
		utils.Logger().Debug().Msg("Check ROLE: " + role)
	}
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	loginId, ok := middlewares.GetLoginIdFromContext(r.Context())
	if !ok {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	authRepo := repos.AuthRepo{}

	loginModel, err := authRepo.GetLoginById(loginId)

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	go authRepo.DeleteLoginById(loginModel.Id)

	w.WriteHeader(http.StatusOK)
}

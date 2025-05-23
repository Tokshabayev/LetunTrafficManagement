package handlers

import (
	"encoding/json"
	"letun-api/core/crypto"
	"letun-api/core/crypto/jwtx"
	"letun-api/core/dtos/invites"
	"letun-api/core/models"
	"letun-api/core/repos"
	"letun-api/core/utils"
	"letun-api/core/utils/validators"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type InvitesHandler struct{}

func (h *InvitesHandler) Send(w http.ResponseWriter, r *http.Request) {
	var dto invites.InviteCreateDto
	err := utils.GetBody(r, &dto)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	invitesRepo := repos.InvitesRepo{}
	inviteModel, _ := invitesRepo.GetInviteByEmail(dto.Email)
	if inviteModel.Id != 0 {
		http.Error(w, "invite-exists-with-email", http.StatusBadRequest)
		return
	}

	usersRepo := repos.UsersRepo{}
	userModel, _ := usersRepo.GetUserByEmail(dto.Email)
	if userModel.Id != 0 {
		http.Error(w, "user-exists-with-email", http.StatusBadRequest)
		return
	}

	inviteId, err := invitesRepo.GetNewInviteId()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	now := time.Now().UTC()
	inviteJWT := jwtx.InviteJWT{}
	token, err := inviteJWT.GenerateToken(jwtx.InviteClaims{
		InviteId: inviteId,
		ExpireAt: now.Add(time.Hour * 48),
	})

	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	tokenHash := crypto.HashToken(token)

	roleModel, err := usersRepo.GetRoleByCode(dto.RoleCode)
	if err != nil {
		http.Error(w, "invalid-role-code", http.StatusBadRequest)
		return
	}

	err = invitesRepo.Create(&models.Invite{
		Id:             inviteId,
		Email:          dto.Email,
		TokenHash:      tokenHash,
		CreatedAt:      now,
		ExpirationDate: now.Add(time.Hour * 24 * 2),
		RoleId:         roleModel.Id,
		IsUsed:         false,
	})

	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	utils.Logger().Info().Msgf("INVITES: created with url http://localhost:3000/invite/%s", token)
}

func (h *InvitesHandler) CheckInvite(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimPrefix(r.URL.Path, "/invites/check/")
	if token == "" {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	inviteJWT := jwtx.InviteJWT{}
	claims, err := inviteJWT.ExtractClaims(token)
	if err != nil {
		http.Error(w, "invalid-token", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC()
	if claims.ExpireAt.Before(now) {
		http.Error(w, "invite-expired", http.StatusBadRequest)
		return
	}

	invitesRepo := repos.InvitesRepo{}
	inviteModel, err := invitesRepo.GetInviteById(claims.InviteId)
	if err != nil {
		http.Error(w, "invalid-token", http.StatusBadRequest)
		return
	}

	if inviteModel.IsUsed {
		http.Error(w, "invite-already-used", http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"isValid": true,
	})
}

func (h *InvitesHandler) List(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	filter := query.Get("filter")
	pageStr := query.Get("page")
	takeStr := query.Get("take")

	page, err := strconv.Atoi(pageStr)
	if err != nil {
		page = 1
	}

	take, err := strconv.Atoi(takeStr)
	if err != nil {
		take = 10
	}

	invitesRepo := repos.InvitesRepo{}
	invitesList, total, err := invitesRepo.List(filter, page, take)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	usersRepo := repos.UsersRepo{}
	var inviteDtos []invites.InviteInfoDto
	for i := 0; i < len(invitesList); i++ {
		inviteModel := invitesList[i]

		roleModel, err := usersRepo.GetRoleById(inviteModel.RoleId)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		inviteDto := invites.InviteInfoDto{
			Id:        inviteModel.Id,
			Email:     inviteModel.Email,
			RoleCode:  roleModel.Code,
			CreatedAt: inviteModel.CreatedAt.UTC().Format("2006-01-02 15:04:05"),
			IsExpired: inviteModel.ExpirationDate.Before(time.Now().UTC()),
			IsUsed:    inviteModel.IsUsed,
		}

		inviteDtos = append(inviteDtos, inviteDto)
	}

	response := invites.InvitesListResponseDto{
		Invites: inviteDtos,
		MaxPage: (total + take - 1) / take,
		Total:   total,
	}

	json.NewEncoder(w).Encode(response)
}

func (h *InvitesHandler) SendOtp(w http.ResponseWriter, r *http.Request) {
	var dto invites.InviteSendOtpDto
	err := utils.GetBody(r, &dto)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	inviteJWT := jwtx.InviteJWT{}
	claims, err := inviteJWT.ExtractClaims(dto.Token)
	if err != nil {
		http.Error(w, "invalid-token", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC()
	if claims.ExpireAt.Before(now) {
		http.Error(w, "invite-expired", http.StatusBadRequest)
		return
	}

	invitesRepo := repos.InvitesRepo{}
	inviteModel, err := invitesRepo.GetInviteById(claims.InviteId)
	if err != nil {
		http.Error(w, "invalid-token", http.StatusBadRequest)
		return
	}

	if inviteModel.IsUsed {
		http.Error(w, "invite-already-used", http.StatusBadRequest)
		return
	}

	normalizedPhone, err := validators.ValidatePhoneNumber(dto.PhoneNumber, "KZ")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	usersRepo := repos.UsersRepo{}
	userModel, _ := usersRepo.GetUserByPhoneNumber(normalizedPhone)
	if userModel.Id != 0 {
		http.Error(w, "user-exists-with-phone-number", http.StatusBadRequest)
		return
	}

	authRepo := repos.AuthRepo{}
	otpModel, _ := authRepo.GetOtpCodeByPhoneNumber(normalizedPhone)

	if otpModel.Id == 0 {
		otpId, err := authRepo.GetNewOtpId()
		if err != nil {
			http.Error(w, "internal-server-error", http.StatusInternalServerError)
			return
		}

		authRepo.CreateOtpCode(&models.OTPCode{
			Id:                         otpId,
			PhoneNumber:                normalizedPhone,
			Code:                       "123123",
			LastSendTryAt:              now,
			SendOtpTriesCounted:        0,
			LoginOtpTriesCounted:       0,
			PasswordLoginTokenHash:     "",
			PasswordVerifyTriesCounted: 0,
			IsProcessed:                false,
		})

		inviteModel.OtpCodeId = &otpId
		invitesRepo.Update(inviteModel)

		w.WriteHeader(http.StatusOK)
		return
	}

	sendDuration := now.Sub(otpModel.LastSendTryAt)
	hours := sendDuration.Hours()
	if hours > 1 {
		otpModel.SendOtpTriesCounted = 0
	} else if otpModel.SendOtpTriesCounted >= 5 {
		http.Error(w, "too-many-requests", http.StatusTooManyRequests)
		return
	}

	authRepo.UpdateOtpCode(&models.OTPCode{
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

	inviteModel.OtpCodeId = &otpModel.Id
	invitesRepo.Update(inviteModel)
}

func (h *InvitesHandler) LoginOtp(w http.ResponseWriter, r *http.Request) {
	var dto invites.InviteLoginDto
	err := utils.GetBody(r, &dto)

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	inviteJWT := jwtx.InviteJWT{}
	claims, err := inviteJWT.ExtractClaims(dto.Token)
	if err != nil {
		http.Error(w, "invalid-token", http.StatusBadRequest)
		return
	}

	invitesRepo := repos.InvitesRepo{}
	inviteModel, err := invitesRepo.GetInviteById(claims.InviteId)
	if err != nil {
		http.Error(w, "invalid-token", http.StatusBadRequest)
		return
	}

	if inviteModel.IsUsed {
		http.Error(w, "invite-already-used", http.StatusBadRequest)
		return
	}

	if inviteModel.OtpCodeId == nil {
		http.Error(w, "otp-not-sent", http.StatusBadRequest)
		return
	}

	authRepo := repos.AuthRepo{}
	otpModel, _ := authRepo.GetOtpCodeById(*inviteModel.OtpCodeId)

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

	roleModel, err := userRepo.GetRoleById(inviteModel.RoleId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if roleModel.PasswordRequired {
		w.Header().Set("Content-Type", "application/json")
		passwordJWT := jwtx.PassowrdVerifyJWT{}
		passwordToken, pswrdErr := passwordJWT.GenerateToken(jwtx.PasswordVerifyClaims{
			OtpCodeId:   otpModel.Id,
			NewPassword: true,
			ExpireAt:    now.Add(15 * time.Minute),
		})
		if pswrdErr != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		now := time.Now().UTC()
		userModel := models.User{
			PhoneNumber: otpModel.PhoneNumber,
			CreatedAt:   now,
			UpdatedAt:   now,
			RoleId:      roleModel.Id,
		}
		userRepo.CreateUser(&userModel)

		json.NewEncoder(w).Encode(
			map[string]any{
				"passwordRequired":   true,
				"newPassword":        true,
				"passwordLoginToken": passwordToken,
			},
		)

		passwordTokenHash := crypto.HashToken(passwordToken)
		otpModel.PasswordLoginTokenHash = passwordTokenHash
		go authRepo.UpdateOtpCode(otpModel)

		inviteModel.IsUsed = true
		go invitesRepo.Update(inviteModel)

		return
	}

	userModel := models.User{
		PhoneNumber: otpModel.PhoneNumber,
		CreatedAt:   now,
		UpdatedAt:   now,
		RoleId:      roleModel.Id,
		Email:       inviteModel.Email,
	}
	userRepo.CreateUser(&userModel)

	login, lErr := manageNewLogin(&userModel, roleModel.Code, authRepo)
	if lErr != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	otpModel.IsProcessed = true
	go authRepo.UpdateOtpCode(otpModel)

	inviteModel.IsUsed = true
	go invitesRepo.Update(inviteModel)

	json.NewEncoder(w).Encode(login)
}

func (h *InvitesHandler) Resend(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	invitesRepo := repos.InvitesRepo{}
	inviteModel, err := invitesRepo.GetInviteById(id)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	if inviteModel.IsUsed {
		http.Error(w, "invite-already-used", http.StatusBadRequest)
		return
	}

	now := time.Now().UTC()
	expireAt := now.Add(time.Hour * 48)
	inviteJWT := jwtx.InviteJWT{}
	token, err := inviteJWT.GenerateToken(jwtx.InviteClaims{
		InviteId: inviteModel.Id,
		ExpireAt: expireAt,
	})

	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	tokenHash := crypto.HashToken(token)
	inviteModel.TokenHash = tokenHash
	inviteModel.ExpirationDate = expireAt
	invitesRepo.Update(inviteModel)

	w.WriteHeader(http.StatusOK)
}

func (h *InvitesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	invitesRepo := repos.InvitesRepo{}
	inviteModel, err := invitesRepo.GetInviteById(id)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	invitesRepo.Delete(inviteModel)

	w.WriteHeader(http.StatusOK)
}

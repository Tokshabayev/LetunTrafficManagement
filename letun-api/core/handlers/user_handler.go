package handlers

import (
	"encoding/json"
	"letun-api/core/dtos/users"
	"letun-api/core/middlewares"
	"letun-api/core/models"
	"letun-api/core/repos"
	"letun-api/core/utils"
	"letun-api/core/utils/validators"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type UserHandler struct{}

func (h *UserHandler) GetCurrentUser(w http.ResponseWriter, r *http.Request) {
	usersRepo := repos.UsersRepo{}

	userId, _ := middlewares.GetUserIdFromContext(r.Context())
	roleCode, _ := middlewares.GetRoleCodeFromContext(r.Context())

	user, err := usersRepo.GetUserById(userId)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	resp := users.UserInfoDto{
		Id:          user.Id,
		Name:        user.Name,
		Email:       user.Email,
		RoleCode:    roleCode,
		RoleId:      user.RoleId,
		PhoneNumber: user.PhoneNumber,
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *UserHandler) GetAll(w http.ResponseWriter, r *http.Request) {
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

	usersRepo := repos.UsersRepo{}
	usersList, maxCount, err := usersRepo.List(filter, page, take)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var userDtos []users.UserInfoDto
	for i := 0; i < len(usersList); i++ {
		userModel := usersList[i]
		role, err := usersRepo.GetRoleById(userModel.RoleId)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		userDto := users.UserInfoDto{
			Id:          userModel.Id,
			Name:        userModel.Name,
			Email:       userModel.Email,
			RoleCode:    role.Code,
			RoleId:      userModel.RoleId,
			PhoneNumber: userModel.PhoneNumber,
		}

		userDtos = append(userDtos, userDto)
	}

	resp := users.UsersListResponseDto{
		Users:   userDtos,
		Total:   maxCount,
		MaxPage: (maxCount + take - 1) / take,
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var dto users.UserCreateDto
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
	user, err := usersRepo.GetUserByPhoneNumber(normalizedPhone)
	if user.Id != 0 {
		http.Error(w, "user-with-phone-exists", http.StatusBadRequest)
		return
	}

	if dto.Email != "" {
		user, err = usersRepo.GetUserByEmail(dto.Email)
		if user.Id != 0 {
			http.Error(w, "user-with-email-exists", http.StatusBadRequest)
			return
		}
	}

	role, err := usersRepo.GetRoleByCode(dto.RoleCode)
	if err != nil {
		http.Error(w, "role-not-found", http.StatusBadRequest)
		return
	}

	userModel := models.User{
		Name:        dto.Name,
		PhoneNumber: normalizedPhone,
		Email:       dto.Email,
		RoleId:      role.Id,
	}

	err = usersRepo.CreateUser(&userModel)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *UserHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	var dto users.UserUpdateDto
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

	user, err := usersRepo.GetUserById(dto.Id)
	if err != nil {
		http.Error(w, "user-not-found", http.StatusBadRequest)
		return
	}

	if user.PhoneNumber != normalizedPhone {
		user, _ := usersRepo.GetUserByPhoneNumber(normalizedPhone)
		if user.Id != 0 {
			http.Error(w, "user-with-phone-exists", http.StatusBadRequest)
			return
		}
	}

	if dto.Email != "" && dto.Email != user.Email {
		user, err = usersRepo.GetUserByEmail(dto.Email)
		if user.Id != 0 {
			http.Error(w, "user-with-email-exists", http.StatusBadRequest)
			return
		}
	}

	role, err := usersRepo.GetRoleByCode(dto.RoleCode)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	err = usersRepo.UpdateUser(
		&models.User{
			Id:          dto.Id,
			Name:        dto.Name,
			PhoneNumber: normalizedPhone,
			Email:       dto.Email,
			RoleId:      role.Id,
		},
	)

	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *UserHandler) BlockUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	usersRepo := repos.UsersRepo{}
	user, err := usersRepo.GetUserById(id)
	if err != nil {
		http.Error(w, "user-not-found", http.StatusBadRequest)
		return
	}

	if user.IsActive {
		user.IsActive = false
		usersRepo.UpdateUser(user)
	} else {
		http.Error(w, "user-already-blocked", http.StatusBadRequest)
		return
	}

	authRepo := repos.AuthRepo{}
	authRepo.SetUserAsBlocked(id)

	w.WriteHeader(http.StatusOK)
}

func (h *UserHandler) UnblockUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	usersRepo := repos.UsersRepo{}
	user, err := usersRepo.GetUserById(id)
	if err != nil {
		http.Error(w, "user-not-found", http.StatusBadRequest)
		return
	}

	if !user.IsActive {
		user.IsActive = true
		usersRepo.UpdateUser(user)
	} else {
		http.Error(w, "user-already-unblocked", http.StatusBadRequest)
		return
	}

	authRepo := repos.AuthRepo{}
	authRepo.UnblockUser(id)

	w.WriteHeader(http.StatusOK)
}

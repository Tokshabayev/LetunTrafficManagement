package repos

import (
	"fmt"
	"letun-api/core/db"
	"letun-api/core/models"
	"time"

	"github.com/patrickmn/go-cache"
)

type UsersRepo struct{}

var usersCache = cache.New(5*time.Minute, 10*time.Minute)
var rolesCache = cache.New(24*time.Hour, 48*time.Hour)

func (r *UsersRepo) CreateUser(user *models.User) error {
	err := db.DB.Create(&user).Error
	if err == nil {
		usersCache.Delete("user:id:" + itoa(user.Id))
		usersCache.Delete("user:email:" + user.Email)
		usersCache.Delete("user:phone:" + user.PhoneNumber)
	}
	return err
}

func (r *UsersRepo) UpdateUser(user *models.User) error {
	usersCache.Delete("user:id:" + itoa(user.Id))
	usersCache.Delete("user:email:" + user.Email)
	usersCache.Delete("user:phone:" + user.PhoneNumber)
	return db.DB.Save(user).Error
}

func (r *UsersRepo) GetUserByEmail(email string) (*models.User, error) {
	cacheKey := "user:email:" + email
	if cached, found := usersCache.Get(cacheKey); found {
		return cached.(*models.User), nil
	}

	var user models.User
	err := db.DB.Where("email = ?", email).First(&user).Error
	if err == nil {
		usersCache.Set(cacheKey, &user, cache.DefaultExpiration)
	}
	return &user, err
}

func (r *UsersRepo) GetUserByPhoneNumber(phoneNumber string) (*models.User, error) {
	cacheKey := "user:phone:" + phoneNumber
	if cached, found := usersCache.Get(cacheKey); found {
		return cached.(*models.User), nil
	}

	var user models.User
	err := db.DB.Where("phone_number = ?", phoneNumber).First(&user).Error
	if err == nil {
		usersCache.Set(cacheKey, &user, cache.DefaultExpiration)
	}
	return &user, err
}

func (r *UsersRepo) GetUserById(userId int) (*models.User, error) {
	cacheKey := "user:id:" + itoa(userId)
	if cached, found := usersCache.Get(cacheKey); found {
		return cached.(*models.User), nil
	}

	var user models.User
	err := db.DB.Where("id = ?", userId).First(&user).Error
	if err == nil {
		usersCache.Set(cacheKey, &user, cache.DefaultExpiration)
	}
	return &user, err
}

func (r *UsersRepo) List(filter string, page int, take int) ([]models.User, int, error) {
	var usersList []models.User
	var totalCount int64

	query := db.DB.Model(&models.User{})

	// Фильтрация
	if filter != "" {
		filter := "%" + filter + "%"
		query = query.Where("email ILIKE ? OR phone_number ILIKE ?", filter, filter)
	}

	// Подсчёт общего количества
	if err := query.Count(&totalCount).Error; err != nil {
		return []models.User{}, 0, err
	}

	// Пагинация
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * take

	// Основной запрос
	if err := query.
		Limit(take).
		Offset(offset).
		Find(&usersList).Error; err != nil {
		return []models.User{}, 0, err
	}

	return usersList, int(totalCount), nil
}

func (r *UsersRepo) DeleteUser(userId int) error {
	return db.DB.Delete(&models.User{}, userId).Error
}

func (r *UsersRepo) CreateRole(role *models.Role) error {
	err := db.DB.Create(&role).Error
	if err == nil {
		rolesCache.Delete("role:id:" + itoa(role.Id))
		rolesCache.Delete("role:code:" + role.Code)
	}
	return err
}

func (r *UsersRepo) GetRoleById(roleId int) (*models.Role, error) {
	cacheKey := "role:id:" + itoa(roleId)
	if cached, found := rolesCache.Get(cacheKey); found {
		return cached.(*models.Role), nil
	}

	var role models.Role
	err := db.DB.Where("id = ?", roleId).First(&role).Error
	if err == nil {
		rolesCache.Set(cacheKey, &role, cache.DefaultExpiration)
	}
	return &role, err
}

func (r *UsersRepo) GetRoleByCode(code string) (*models.Role, error) {
	cacheKey := "role:code:" + code
	if cached, found := rolesCache.Get(cacheKey); found {
		return cached.(*models.Role), nil
	}

	var role models.Role
	err := db.DB.Where("code = ?", code).First(&role).Error
	if err == nil {
		rolesCache.Set(cacheKey, &role, cache.DefaultExpiration)
	}
	return &role, err
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}

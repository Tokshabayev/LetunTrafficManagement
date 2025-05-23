package repos

import (
	"letun-api/core/db"
	"letun-api/core/models"
	"strconv"
	"time"

	"github.com/patrickmn/go-cache"
)

type AuthRepo struct{}

// Инициализация in-memory кэша
var authCache = cache.New(5*time.Minute, 10*time.Minute)
var blockedUserIds = cache.New(30*time.Minute, 30*time.Minute)

func (r *AuthRepo) CreateOtpCode(otpCode *models.OTPCode) error {
	err := db.DB.Create(otpCode).Error
	if err == nil {
		authCache.Delete("otp:" + otpCode.PhoneNumber)
	}
	return err
}

func (r *AuthRepo) GetNewOtpId() (int, error) {
	var id int
	err := db.DB.Raw("SELECT nextval('otp_codes_id_seq');").Scan(&id).Error
	return id, err
}

func (r *AuthRepo) GetOtpCodeByPhoneNumber(phoneNumber string) (*models.OTPCode, error) {
	cacheKey := "otp:" + phoneNumber
	if cached, found := authCache.Get(cacheKey); found {
		return cached.(*models.OTPCode), nil
	}

	var otpCode models.OTPCode
	err := db.DB.Where("phone_number = ?", phoneNumber).First(&otpCode).Error
	if err == nil {
		authCache.Set(cacheKey, &otpCode, cache.DefaultExpiration)
	}
	return &otpCode, err
}

func (r *AuthRepo) GetOtpCodeByEmail(email string) (*models.OTPCode, error) {
	cacheKey := "otp:" + email
	if cached, found := authCache.Get(cacheKey); found {
		return cached.(*models.OTPCode), nil
	}

	var otpCode models.OTPCode
	err := db.DB.Where("email = ?", email).First(&otpCode).Error
	if err == nil {
		authCache.Set(cacheKey, &otpCode, cache.DefaultExpiration)
	}
	return &otpCode, err
}

func (r *AuthRepo) GetOtpCodeById(id int) (*models.OTPCode, error) {
	var otpCode models.OTPCode
	err := db.DB.Where("id = ?", id).First(&otpCode).Error
	return &otpCode, err
}

func (r *AuthRepo) UpdateOtpCode(otpCode *models.OTPCode) error {
	authCache.Delete("otp:" + otpCode.PhoneNumber)
	return db.DB.Save(otpCode).Error
}

func (r *AuthRepo) CreateLogin(login *models.Login) error {
	err := db.DB.Create(login).Error
	if err == nil {
		authCache.Delete("login_user:" + string(rune(login.UserId)))
	}
	return err
}

func (r *AuthRepo) GetLoginByUserId(userId int) (*models.Login, error) {
	var login models.Login
	err := db.DB.Where("user_id = ?", userId).First(&login).Error
	return &login, err
}

func (r *AuthRepo) GetLoginById(loginId int) (*models.Login, error) {
	var login models.Login
	err := db.DB.Where("id = ?", loginId).First(&login).Error
	return &login, err
}

func (r *AuthRepo) DeleteLoginById(id int) error {
	return db.DB.Where("id = ?", id).Delete(&models.Login{}).Error
}

func (r *AuthRepo) UpdateLogin(login *models.Login) error {
	authCache.Delete("login_user:" + string(rune(login.UserId)))
	return db.DB.Save(login).Error
}

func (r *AuthRepo) GetNewLoginId() (int, error) {
	var id int
	err := db.DB.Raw("SELECT nextval('logins_id_seq');").Scan(&id).Error
	return id, err
}

func (r *AuthRepo) SetUserAsBlocked(userId int) {
	blockedUserIds.Set(strconv.Itoa(userId), true, 30*time.Minute)
}

func (r *AuthRepo) IsUserBlocked(userId int) bool {
	_, found := blockedUserIds.Get(strconv.Itoa(userId))
	return found
}

func (r *AuthRepo) UnblockUser(userId int) {
	blockedUserIds.Delete(strconv.Itoa(userId))
}

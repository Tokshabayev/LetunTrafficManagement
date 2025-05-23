package db

import (
	"letun-api/core/config"
	"letun-api/core/crypto"
	"letun-api/core/models"
	"letun-api/core/utils"
	"letun-api/core/utils/validators"
	"time"

	"gorm.io/gorm"
)

func Seed(db *gorm.DB) {
	var adminRole models.Role
	if err := db.Where("code = ?", "admin").First(&adminRole).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			adminRole = models.Role{
				Code:             "admin",
				PasswordRequired: true,
			}
			db.Create(&adminRole)
			utils.Logger().Info().Msgf("Admin role seeded")
		} else {
			utils.Logger().Fatal().Msgf("Error checking role: %s", err)
		}
	}

	var dispatcherRole models.Role
	if err := db.Where("code = ?", "dispatcher").First(&dispatcherRole).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			dispatcherRole = models.Role{
				Code:             "dispatcher",
				PasswordRequired: false,
			}
			db.Create(&dispatcherRole)
			utils.Logger().Info().Msgf("Dispatcher role seeded")
		} else {
			utils.Logger().Fatal().Msgf("Error checking role: %s", err)
		}
	}

	var pilotRole models.Role
	if err := db.Where("code = ?", "pilot").First(&pilotRole).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			pilotRole = models.Role{
				Code:             "pilot",
				PasswordRequired: false,
			}
			db.Create(&pilotRole)
			utils.Logger().Info().Msgf("Pilot role seeded")
		} else {
			utils.Logger().Fatal().Msgf("Error checking role: %s", err)
		}
	}

	var existingUser models.User
	var seedNumber = config.GetVal("SeedPhoneNumber")
	var phoneNumber, _ = validators.ValidatePhoneNumber(seedNumber, "KZ")
	var email = config.GetVal("SeedEmail")
	var now = time.Now().UTC()
	if err := db.Where("email = ?", email).First(&existingUser).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			passwordHash, err := crypto.HashPassword(config.GetVal("SeedPassword"))
			if err != nil || passwordHash == "" {
				utils.Logger().Fatal().Msgf("Error hashing password: %s", err)
			}

			adminUser := models.User{
				Name:         config.GetVal("SeedName"),
				Email:        email,
				PasswordHash: passwordHash,
				PhoneNumber:  phoneNumber,
				CreatedAt:    now,
				UpdatedAt:    now,
				RoleId:       adminRole.Id,
				IsActive:     true,
			}
			db.Create(&adminUser)

			utils.Logger().Info().Msgf("Admin user seeded")
		} else {
			utils.Logger().Fatal().Msgf("Error checking user: %s", err)
		}
	}
}

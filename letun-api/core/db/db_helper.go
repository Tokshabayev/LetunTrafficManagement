package db

import (
	"letun-api/core/config"
	"letun-api/core/utils"
	"sync"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	DB   *gorm.DB
	once sync.Once
)

func InitDB() *gorm.DB {
	once.Do(func() {
		connStr := config.GetVal("ConnectionString")

		var err error
		DB, err = gorm.Open(postgres.Open(connStr), &gorm.Config{})
		if err != nil {
			utils.Logger().Fatal().Msgf("Error opening DB: %s", err.Error())
		}

		sqlDB, err := DB.DB()
		if err != nil {
			utils.Logger().Fatal().Msgf("Error getting DB instance: %s", err.Error())
		}

		sqlDB.SetMaxOpenConns(25)
		sqlDB.SetMaxIdleConns(10)
		sqlDB.SetConnMaxLifetime(5 * 60)

		runMigrations(sqlDB)

		if err = sqlDB.Ping(); err != nil {
			utils.Logger().Fatal().Msgf("Error pinging DB: %s", err.Error())
		}

		Seed(DB)

		utils.Logger().Info().Msg("DB successfully initialized")
	})

	return DB
}

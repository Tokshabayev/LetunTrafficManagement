package config

import (
	"os"

	"letun-api/core/utils"

	"github.com/joho/godotenv"
)

func InitEnv() {
	utils.Logger().Info().Msgf("Initing environment...")

	dir, wdErr := os.Getwd()
	if wdErr != nil {
		utils.Logger().Fatal().Msgf("Error getting working directory: %s", wdErr.Error())
		return
	}

	err := godotenv.Load(dir + "/.env")
	if err != nil {
		utils.Logger().Fatal().Msgf("Error initing .env file: %s", err.Error())
	}
}

func GetVal(key string) string {
	value := os.Getenv(key)
	if value == "" {
		panic("Environment variable " + key + " is not set")
	}
	return value
}

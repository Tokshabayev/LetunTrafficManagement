package main

import (
	"letun-api/core"
	"letun-api/core/config"
	"letun-api/core/db"
	"letun-api/core/utils"

	"net/http"
)

func main() {
	config.InitEnv()

	r := core.InitRouter()

	db.InitDB()

	port := ":8080"
	utils.Logger().Info().Msgf("Server started on https://local.api.letun%s", port)

	err := http.ListenAndServeTLS(port, "certs/ca.pem", "certs/ca.key", r)
	if err != nil {
		utils.Logger().Fatal().Err(err).Msg("Failed to start HTTPS server")
	}
}

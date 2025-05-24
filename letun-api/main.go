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

	go http.ListenAndServeTLS(port, "certs/ca.pem", "certs/ca.key", r)

	port2 := ":8081"
	utils.Logger().Info().Msgf("Server started on https://local.api.letun%s", port2)

	http.ListenAndServe(port2, r)
}

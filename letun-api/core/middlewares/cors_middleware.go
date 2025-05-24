package middlewares

import (
	"net/http"
	"strings"

	"letun-api/core/config"

	"github.com/rs/cors"
)

var CorsMiddleware = func(h http.Handler) http.Handler {
	corsUrls := config.GetVal("CORS_URLS")
	if corsUrls == "" {
		corsUrls = "http://*;https://*;ws://*"
	}
	corsUrlsArray := strings.Split(corsUrls, ";")

	c := cors.New(cors.Options{
		AllowedOrigins:   corsUrlsArray,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-Refresh-Token"},
		AllowCredentials: true,
	})
	return c.Handler(h)
}

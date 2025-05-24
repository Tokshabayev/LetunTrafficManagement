package middlewares

import (
	"net/http"

	"letun-api/core/config"

	"github.com/rs/cors"
)

var CorsMiddleware = func(h http.Handler) http.Handler {
	corsUrls := config.GetVal("CORS_URLS")
	if corsUrls == "" {
		corsUrls = "*"
	}

	c := cors.New(cors.Options{
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "X-Refresh-Token"},
		AllowCredentials: true,
	})
	return c.Handler(h)
}

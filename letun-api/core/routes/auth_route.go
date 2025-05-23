package routes

import (
	"letun-api/core/handlers"
	"letun-api/core/middlewares"

	"github.com/go-chi/chi/v5"
)

func InitAuthRoute(r *chi.Mux) {
	authHandler := handlers.AuthHandler{}
	r.Route("/auth", func(r chi.Router) {
		r.Post("/sendOtp", authHandler.SendOtp)
		r.Post("/loginOtp", authHandler.LoginOtp)
		r.Post("/passwordVerify", authHandler.PasswordVerify)
		r.Post("/refreshToken", authHandler.RefreshAccessToken)
		r.Post("/logout", middlewares.AuthRequired(authHandler.Logout))
		r.Get("/check", middlewares.AuthRequired(authHandler.Check))
	})
}

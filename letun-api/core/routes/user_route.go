package routes

import (
	"letun-api/core/handlers"
	"letun-api/core/middlewares"

	"github.com/go-chi/chi/v5"
)

func InitUserRoute(r *chi.Mux) {
	userHandler := handlers.UserHandler{}
	r.Route("/user", func(r chi.Router) {
		r.Get("/", middlewares.AuthRequired(userHandler.GetCurrentUser))
		r.Get("/getAll", middlewares.AuthRequired(userHandler.GetAll, "admin"))
		r.Post("/create", middlewares.AuthRequired(userHandler.CreateUser, "admin"))
		r.Put("/update", middlewares.AuthRequired(userHandler.UpdateUser, "admin"))
		r.Put("/block/{id}", middlewares.AuthRequired(userHandler.BlockUser, "admin"))
		r.Put("/unblock/{id}", middlewares.AuthRequired(userHandler.UnblockUser, "admin"))
	})
}

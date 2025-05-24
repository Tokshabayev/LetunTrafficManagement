package routes

import (
	"letun-api/core/handlers"
	"letun-api/core/middlewares"

	"github.com/go-chi/chi/v5"
)

func InitDronesRoute(r *chi.Mux) {
	dronesHandler := handlers.DronesHandler{}
	r.Route("/drones", func(r chi.Router) {
		r.Post("/", middlewares.AuthRequired(dronesHandler.Create, "admin"))
		r.Get("/{id}", middlewares.AuthRequired(dronesHandler.GetById, "admin"))
		r.Get("/", middlewares.AuthRequired(dronesHandler.List, "admin"))
		r.Post("/{id}/block", middlewares.AuthRequired(dronesHandler.Block, "admin"))
		r.Post("/{id}/unblock", middlewares.AuthRequired(dronesHandler.Unblock, "admin"))
		r.Post("/{id}/update", middlewares.AuthRequired(dronesHandler.Update, "admin"))
	})
}

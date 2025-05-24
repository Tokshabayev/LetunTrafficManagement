package routes

import (
	"letun-api/core/handlers"

	"github.com/go-chi/chi/v5"
)

func InitDronesRoute(r *chi.Mux) {
	dronesHandler := handlers.DronesHandler{}
	r.Route("/drones", func(r chi.Router) {
		r.Post("/", dronesHandler.Create)
		r.Get("/{id}", dronesHandler.GetById)
		r.Get("/", dronesHandler.List)
		r.Post("/{id}/block", dronesHandler.Block)
		r.Post("/{id}/unblock", dronesHandler.Unblock)
		r.Post("/{id}/update", dronesHandler.Update)
	})
}

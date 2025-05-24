package routes

import (
	"letun-api/core/handlers"

	"github.com/go-chi/chi/v5"
)

func InitFlightsRoute(r *chi.Mux) {
	flightsHandler := handlers.FlightsHandler{}
	r.Route("/flights", func(r chi.Router) {
		r.Post("/", flightsHandler.Create)
		r.Get("/{id}", flightsHandler.GetById)
		r.Get("/", flightsHandler.List)
		r.Post("/{id}/accept", flightsHandler.Accept)
		r.Post("/{id}/reject", flightsHandler.Reject)
		r.Post("/{id}/start", flightsHandler.Start)
		r.Post("/{id}/finish", flightsHandler.Finish)
	})
}

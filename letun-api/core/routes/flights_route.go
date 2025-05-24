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
		r.Post("/accept/{id}", flightsHandler.Accept)
		r.Post("/reject/{id}", flightsHandler.Reject)
		r.Post("/start/{id}", flightsHandler.Start)
		r.Post("/finish/{id}", flightsHandler.Finish)
	})
}

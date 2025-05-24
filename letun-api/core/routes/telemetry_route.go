package routes

import (
	"letun-api/core/handlers"

	"github.com/go-chi/chi/v5"
)

func InitTelemetryRoute(r *chi.Mux) {
	telemetryHandler := handlers.TelemetryHandler{}
	r.Route("/telemetry", func(r chi.Router) {
		r.Post("/", telemetryHandler.Create)
		r.Get("/{flightId}", telemetryHandler.List)
	})
}

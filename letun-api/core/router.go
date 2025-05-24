package core

import (
	"letun-api/core/middlewares"
	"letun-api/core/routes"
	"letun-api/core/ws"

	"github.com/go-chi/render"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func InitRouter() *chi.Mux {
	r := chi.NewRouter()

	r.Use(middlewares.CorsMiddleware)

	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.URLFormat)

	r.Use(middlewares.Auth)

	r.Use(render.SetContentType(render.ContentTypeJSON))

	r.HandleFunc("/ws", ws.HandleConnections)
	go ws.HandleBroadcast()

	routes.InitAuthRoute(r)
	routes.InitUserRoute(r)
	routes.InitInvitesRoute(r)
	routes.InitFlightsRoute(r)
	routes.InitDronesRoute(r)

	return r
}

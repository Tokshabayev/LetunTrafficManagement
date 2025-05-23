package routes

import (
	"letun-api/core/handlers"
	"letun-api/core/middlewares"

	"github.com/go-chi/chi/v5"
)

func InitInvitesRoute(r *chi.Mux) {
	invitesHandler := handlers.InvitesHandler{}
	r.Route("/invites", func(r chi.Router) {
		r.Post("/send", middlewares.AuthRequired(invitesHandler.Send, "admin"))
		r.Post("/resend/{id}", middlewares.AuthRequired(invitesHandler.Resend, "admin"))
		r.Delete("/delete/{id}", middlewares.AuthRequired(invitesHandler.Delete, "admin"))
		r.Get("/", middlewares.AuthRequired(invitesHandler.List, "admin"))
		r.Post("/sendOtp", invitesHandler.SendOtp)
		r.Post("/loginOtp", invitesHandler.LoginOtp)
		r.Get("/check/{token}", invitesHandler.CheckInvite)
	})
}

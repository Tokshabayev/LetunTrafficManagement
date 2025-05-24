package handlers

import (
	"encoding/json"
	"letun-api/core/dtos/drones"
	"letun-api/core/dtos/flights"
	"letun-api/core/dtos/users"
	"letun-api/core/middlewares"
	"letun-api/core/models"
	"letun-api/core/repos"
	"letun-api/core/ws"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type FlightsHandler struct{}

func (h *FlightsHandler) GetById(w http.ResponseWriter, r *http.Request) {
	flightIdStr := chi.URLParam(r, "id")
	flightId, err := strconv.Atoi(flightIdStr)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	flightsRepo := repos.FlightsRepo{}

	flight, err := flightsRepo.GetFlightById(flightId)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	resp := infoDtoFromFlight(flight)

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *FlightsHandler) List(w http.ResponseWriter, r *http.Request) {
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	take, err := strconv.Atoi(r.URL.Query().Get("take"))
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	flightsRepo := repos.FlightsRepo{}

	flightList, total, err := flightsRepo.List(page, take)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	infoDtos := make([]flights.FlightInfoDto, len(flightList))
	for i, flight := range flightList {
		infoDtos[i] = infoDtoFromFlight(&flight)
	}

	resp := flights.FlightsListResponseDto{
		Flights: infoDtos,
		Total:   total,
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *FlightsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var flightDto flights.FlightCreateDto
	if err := json.NewDecoder(r.Body).Decode(&flightDto); err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	flightsRepo := repos.FlightsRepo{}

	userId, ok := middlewares.GetUserIdFromContext(r.Context())
	if !ok {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	drone, err := flightsRepo.GetFirstActiveDrone()
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	err = flightsRepo.Create(&models.Flight{
		DroneId:   drone.Id,
		UserId:    userId,
		Status:    "pending",
		Points:    flightDto.Points,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	})

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *FlightsHandler) Accept(w http.ResponseWriter, r *http.Request) {
	flightIdStr := chi.URLParam(r, "id")
	flightId, err := strconv.Atoi(flightIdStr)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	flightsRepo := repos.FlightsRepo{}
	flight, err := flightsRepo.GetFlightById(flightId)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	if flight.Status != "pending" {
		http.Error(w, "Flight is not pending", http.StatusBadRequest)
		return
	}

	flight.Status = "accepted"

	err = flightsRepo.Update(flight)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	var points [][2]float64

	json.Unmarshal([]byte(flight.Points), &points)

	ws.SendMessage(ws.StartMsg{
		Type:      "start",
		FlightID:  flightId,
		DroneID:   flight.Drone.Id,
		Route:     points,
		Timestamp: time.Now().Unix(),
	})

	w.WriteHeader(http.StatusOK)
}

func (h *FlightsHandler) Reject(w http.ResponseWriter, r *http.Request) {
	flightIdStr := chi.URLParam(r, "id")
	flightId, err := strconv.Atoi(flightIdStr)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	flightsRepo := repos.FlightsRepo{}
	flight, err := flightsRepo.GetFlightById(flightId)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	if flight.Status != "pending" {
		http.Error(w, "Flight is not pending", http.StatusBadRequest)
		return
	}

	flight.Status = "rejected"

	err = flightsRepo.Update(flight)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *FlightsHandler) Start(w http.ResponseWriter, r *http.Request) {
	flightIdStr := chi.URLParam(r, "id")
	flightId, err := strconv.Atoi(flightIdStr)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	flightsRepo := repos.FlightsRepo{}

	flight, err := flightsRepo.GetFlightById(flightId)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	if flight.Status != "accepted" {
		http.Error(w, "Flight is not accepted", http.StatusBadRequest)
		return
	}

	if flight.Drone.IsFlying {
		http.Error(w, "Drone is already flying", http.StatusBadRequest)
		return
	}

	if !flight.Drone.IsActive {
		http.Error(w, "Drone is not active", http.StatusBadRequest)
		return
	}

	flight.Drone.IsFlying = true
	flight.Status = "started"

	err = flightsRepo.Update(flight)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	droneRepo := repos.DronesRepo{}
	droneRepo.Update(&flight.Drone)

	w.WriteHeader(http.StatusOK)
}

func (h *FlightsHandler) Finish(w http.ResponseWriter, r *http.Request) {
	flightIdStr := chi.URLParam(r, "id")
	flightId, err := strconv.Atoi(flightIdStr)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	flightsRepo := repos.FlightsRepo{}
	flight, err := flightsRepo.GetFlightById(flightId)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	if flight.Status != "started" {
		http.Error(w, "Flight is not started", http.StatusBadRequest)
		return
	}

	flight.Drone.IsFlying = false
	flight.Status = "finished"

	err = flightsRepo.Update(flight)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	droneRepo := repos.DronesRepo{}
	droneRepo.Update(&flight.Drone)

	w.WriteHeader(http.StatusOK)
}

func infoDtoFromFlight(flight *models.Flight) flights.FlightInfoDto {
	droneInfo := drones.DroneInfoDto{
		Id:          flight.Drone.Id,
		Model:       flight.Drone.Model,
		WeightLimit: flight.Drone.WeightLimit,
		Battery:     flight.Drone.Battery,
		IsActive:    flight.Drone.IsActive,
		IsFlying:    flight.Drone.IsFlying,
	}

	userInfo := users.UserInfoDto{
		Id:          flight.User.Id,
		Name:        flight.User.Name,
		Email:       flight.User.Email,
		RoleId:      flight.User.RoleId,
		IsActive:    flight.User.IsActive,
		PhoneNumber: flight.User.PhoneNumber,
	}

	return flights.FlightInfoDto{
		Id:        flight.Id,
		Drone:     droneInfo,
		User:      userInfo,
		Status:    flight.Status,
		Points:    flight.Points,
		CreatedAt: flight.CreatedAt,
		UpdatedAt: flight.UpdatedAt,
	}
}

package handlers

import (
	"encoding/json"
	"letun-api/core/dtos/telemetry"
	"letun-api/core/models"
	"letun-api/core/repos"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
)

type TelemetryHandler struct{}

func (h *TelemetryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var telemetryDto telemetry.TelemetryCreateDto
	if err := json.NewDecoder(r.Body).Decode(&telemetryDto); err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	telemetryRepo := repos.TelemetryRepo{}

	err := telemetryRepo.Create(&models.Telemetry{
		FlightId:  telemetryDto.FlightId,
		Latitude:  telemetryDto.Latitude,
		Longitude: telemetryDto.Longitude,
		Altitude:  telemetryDto.Altitude,
		Speed:     telemetryDto.Speed,
		Timestamp: telemetryDto.Timestamp,
		CreatedAt: time.Now(),
	})

	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *TelemetryHandler) List(w http.ResponseWriter, r *http.Request) {
	flightIdStr := chi.URLParam(r, "flightId")
	flightId, err := strconv.Atoi(flightIdStr)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	telemetryRepo := repos.TelemetryRepo{}
	telemetries, err := telemetryRepo.List(flightId)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	infoDtos := make([]telemetry.TelemetryInfoDto, len(telemetries))
	for i, telemetryModel := range telemetries {
		infoDtos[i] = telemetry.TelemetryInfoDto{
			Id:        telemetryModel.Id,
			FlightId:  telemetryModel.FlightId,
			Latitude:  telemetryModel.Latitude,
			Longitude: telemetryModel.Longitude,
			Altitude:  telemetryModel.Altitude,
			Speed:     telemetryModel.Speed,
			Timestamp: telemetryModel.Timestamp,
			CreatedAt: telemetryModel.CreatedAt,
		}
	}

	if err := json.NewEncoder(w).Encode(infoDtos); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

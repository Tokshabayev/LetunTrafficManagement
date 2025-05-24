package handlers

import (
	"encoding/json"
	"letun-api/core/dtos/drones"
	"letun-api/core/models"
	"letun-api/core/repos"
	"letun-api/core/utils"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type DronesHandler struct{}

func (h *DronesHandler) GetById(w http.ResponseWriter, r *http.Request) {
	droneIdStr := chi.URLParam(r, "id")
	droneId, err := strconv.Atoi(droneIdStr)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	dronesRepo := repos.DronesRepo{}

	drone, err := dronesRepo.GetDroneById(droneId)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	resp := drones.DroneInfoDto{
		Id:          drone.Id,
		Model:       drone.Model,
		WeightLimit: drone.WeightLimit,
		Battery:     drone.Battery,
		IsActive:    drone.IsActive,
		IsFlying:    drone.IsFlying,
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *DronesHandler) List(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	filter := query.Get("filter")
	pageStr := query.Get("page")
	takeStr := query.Get("take")

	page, err := strconv.Atoi(pageStr)
	if err != nil {
		page = 1
	}

	take, err := strconv.Atoi(takeStr)
	if err != nil {
		take = 10
	}

	dronesRepo := repos.DronesRepo{}
	dronesList, maxCount, err := dronesRepo.List(filter, page, take, nil)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var droneDtos []drones.DroneInfoDto
	for i := 0; i < len(dronesList); i++ {
		droneModel := dronesList[i]
		droneDto := drones.DroneInfoDto{
			Id:          droneModel.Id,
			Model:       droneModel.Model,
			WeightLimit: droneModel.WeightLimit,
			Battery:     droneModel.Battery,
			IsActive:    droneModel.IsActive,
		}

		droneDtos = append(droneDtos, droneDto)
	}

	resp := drones.DronesListResponseDto{
		Drones:  droneDtos,
		Total:   maxCount,
		MaxPage: (maxCount + take - 1) / take,
	}

	if err := json.NewEncoder(w).Encode(resp); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func (h *DronesHandler) Create(w http.ResponseWriter, r *http.Request) {
	var dto drones.DroneCreateDto
	err := utils.GetBody(r, &dto)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	droneModel := models.Drone{
		Model:       dto.Model,
		WeightLimit: dto.WeightLimit,
		Battery:     dto.Battery,
		IsActive:    true,
	}

	dronesRepo := repos.DronesRepo{}
	err = dronesRepo.Create(&droneModel)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *DronesHandler) Update(w http.ResponseWriter, r *http.Request) {
	var dto drones.DroneUpdateDto
	err := utils.GetBody(r, &dto)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}
	dronesRepo := repos.DronesRepo{}

	drone, err := dronesRepo.GetDroneById(dto.Id)
	if err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	droneModel := models.Drone{
		Id:          dto.Id,
		Model:       dto.Model,
		WeightLimit: dto.WeightLimit,
		Battery:     dto.Battery,
		IsActive:    dto.IsActive,
		IsFlying:    drone.IsFlying,
	}

	err = dronesRepo.Update(&droneModel)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *DronesHandler) Block(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	dronesRepo := repos.DronesRepo{}
	drone, err := dronesRepo.GetDroneById(id)
	if err != nil {
		http.Error(w, "drone-not-found", http.StatusBadRequest)
		return
	}

	if drone.IsActive {
		drone.IsActive = false
		dronesRepo.Update(drone)
	} else {
		http.Error(w, "drone-already-blocked", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *DronesHandler) Unblock(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid-request-data", http.StatusBadRequest)
		return
	}

	dronesRepo := repos.DronesRepo{}
	drone, err := dronesRepo.GetDroneById(id)
	if err != nil {
		http.Error(w, "drone-not-found", http.StatusBadRequest)
		return
	}

	if !drone.IsActive {
		drone.IsActive = true
		dronesRepo.Update(drone)
	} else {
		http.Error(w, "drone-already-unblocked", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

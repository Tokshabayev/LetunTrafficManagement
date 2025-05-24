package repos

import (
	"letun-api/core/db"
	"letun-api/core/models"
)

type TelemetryRepo struct{}

func (r *TelemetryRepo) Create(telemetry *models.Telemetry) error {
	err := db.DB.Create(&telemetry).Error
	return err
}

func (r *TelemetryRepo) List(flightId int) ([]models.Telemetry, error) {
	var telemetry []models.Telemetry
	err := db.DB.Where("flight_id = ?", flightId).Find(&telemetry).Error
	return telemetry, err
}

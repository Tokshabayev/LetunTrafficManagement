package repos

import (
	"letun-api/core/db"
	"letun-api/core/models"
)

type FlightsRepo struct{}

func (r *FlightsRepo) GetFlightById(id int) (*models.Flight, error) {
	var flight models.Flight
	err := db.DB.Where("id = ?", id).
		Joins("Join drones on drones.id = flights.drone_id").
		Joins("Join users on users.id = flights.user_id").
		First(&flight).Error

	return &flight, err
}

func (r *FlightsRepo) Create(flight *models.Flight) error {
	err := db.DB.Create(&flight).Error
	return err
}

func (r *FlightsRepo) Update(flight *models.Flight) error {
	err := db.DB.Save(&flight).Error
	return err
}

func (r *FlightsRepo) List(page int, take int) ([]models.Flight, int, error) {
	var flightsList []models.Flight
	var totalCount int64

	query := db.DB.Model(&models.Flight{})

	if err := query.Count(&totalCount).Error; err != nil {
		return []models.Flight{}, 0, err
	}

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * take

	if err := query.
		Limit(take).
		Offset(offset).
		Joins("Join drones on drones.id = flights.drone_id").
		Joins("Join users on users.id = flights.user_id").
		Find(&flightsList).Error; err != nil {
		return []models.Flight{}, 0, err
	}

	return flightsList, int(totalCount), nil
}

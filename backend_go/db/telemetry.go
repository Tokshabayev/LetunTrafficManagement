package db

import (
	"context"
	"fmt"
	"log"

	"letunbackend/models"
)

// SaveTelemetry сохраняет данные о телеметрии дрона в таблицу telemetry
func SaveTelemetry(t models.TelemetryData) error {
	query := `INSERT INTO telemetry 
		(drone_id, latitude, longitude, altitude, speed, timestamp) 
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := Pool.Exec(context.Background(), query,
		t.DroneID,
		t.Latitude,
		t.Longitude,
		t.Altitude,
		t.Speed,
		t.Timestamp,
	)

	if err != nil {
		log.Printf("❌ Ошибка сохранения телеметрии: %v", err)
		return fmt.Errorf("ошибка сохранения телеметрии: %w", err)
	}

	log.Printf("✅ Телеметрия сохранена: drone_id=%d, lat=%.5f, lon=%.5f", t.DroneID, t.Latitude, t.Longitude)
	return nil
}

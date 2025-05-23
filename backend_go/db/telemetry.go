package db

import (
    "context"
    "fmt"
    "log"
)

type Telemetry struct {
    Type      string  `json:"type"`
    DroneID   int     `json:"drone_id"`
    Latitude  float64 `json:"latitude"`
    Longitude float64 `json:"longitude"`
    Altitude  int     `json:"altitude"`
    Speed     int     `json:"speed"`
}

func SaveTelemetry(t Telemetry) error {
    query := `
        INSERT INTO telemetry (drone_id, latitude, longitude, altitude, speed)
        VALUES ($1, $2, $3, $4, $5)
    `
    _, err := Pool.Exec(context.Background(), query, t.DroneID, t.Latitude, t.Longitude, t.Altitude, t.Speed)
    if err != nil {
        log.Printf("❌ Ошибка сохранения телеметрии: %v", err)
        return fmt.Errorf("ошибка сохранения телеметрии: %w", err)
    }
    return nil
}
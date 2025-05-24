package models

import "time"

type Telemetry struct {
	Id        int       `json:"id"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Altitude  float64   `json:"altitude"`
	Speed     float64   `json:"speed"`
	Timestamp float64   `json:"heading"`
	CreatedAt time.Time `json:"created_at"`
	FlightId  int       `json:"flight_id"`
}

package models

type TelemetryData struct {
	Type      string  `json:"type"`
	DroneID   int     `json:"drone_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Altitude  int     `json:"altitude"`
	Speed     int     `json:"speed"`
	Timestamp float64 `json:"timestamp"`
}

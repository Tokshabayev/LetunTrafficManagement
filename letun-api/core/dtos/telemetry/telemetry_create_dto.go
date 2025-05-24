package telemetry

type TelemetryCreateDto struct {
	FlightId  int     `json:"flight_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Altitude  float64 `json:"altitude"`
	Speed     float64 `json:"speed"`
	Timestamp float64 `json:"timestamp"`
}

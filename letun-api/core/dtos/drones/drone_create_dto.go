package drones

type DroneCreateDto struct {
	Model       string `json:"model"`
	WeightLimit int    `json:"weightLimit"`
	Battery     int    `json:"battery"`
}

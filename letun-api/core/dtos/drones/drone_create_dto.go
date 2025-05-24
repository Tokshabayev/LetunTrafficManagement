package drones

type DroneCreateDto struct {
	Model       string `json:"model"`
	WeightLimit string `json:"weightLimit"`
	Battery     string `json:"battery"`
}

package drones

type DroneUpdateDto struct {
	Id          int    `json:"id"`
	Model       string `json:"model"`
	WeightLimit int    `json:"weightLimit"`
	Battery     int    `json:"battery"`
	IsActive    bool   `json:"isActive"`
}

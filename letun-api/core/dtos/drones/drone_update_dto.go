package drones

type DroneUpdateDto struct {
	Id          int    `json:"id"`
	Model       string `json:"model"`
	WeightLimit string `json:"weightLimit"`
	Battery     string `json:"battery"`
	IsActive    bool   `json:"isActive"`
}

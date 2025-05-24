package models

type Drone struct {
	Id          int    `json:"id"`
	Model       string `json:"model"`
	WeightLimit string `json:"weight_limit"`
	Battery     string `json:"battery"`
	IsActive    bool   `json:"is_active"`
	IsFlying    bool   `json:"is_flying"`
}

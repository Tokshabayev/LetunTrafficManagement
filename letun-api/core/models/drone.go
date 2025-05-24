package models

type Drone struct {
	Id          int    `json:"id"`
	Model       string `json:"model"`
	WeightLimit int    `json:"weight_limit"`
	Battery     int    `json:"battery"`
	IsActive    bool   `json:"is_active"`
	IsFlying    bool   `json:"is_flying"`
}

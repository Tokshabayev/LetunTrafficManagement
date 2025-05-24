package drones

type DronesListResponseDto struct {
	Drone   []DroneInfoDto `json:"drone"`
	MaxPage int            `json:"maxPage"`
	Total   int            `json:"total"`
}

package drones

type DronesListResponseDto struct {
	Drones  []DroneInfoDto `json:"drones"`
	MaxPage int            `json:"maxPage"`
	Total   int            `json:"total"`
}

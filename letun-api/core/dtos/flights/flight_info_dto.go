package flights

import (
	"letun-api/core/dtos/drones"
	"letun-api/core/dtos/users"
	"time"
)

type FlightInfoDto struct {
	Id        int                 `json:"id"`
	Drone     drones.DroneInfoDto `json:"drone"`
	User      users.UserInfoDto   `json:"user"`
	Status    string              `json:"status"`
	Points    string              `json:"points"`
	CreatedAt time.Time           `json:"createdAt"`
	UpdatedAt time.Time           `json:"updatedAt"`
}

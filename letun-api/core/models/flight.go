package models

import "time"

type Flight struct {
	Id        int       `json:"id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DroneId   int       `json:"drone_id"`
	UserId    int       `json:"user_id"`
	Drone     Drone     `json:"drone"`
	User      User      `json:"user"`
}

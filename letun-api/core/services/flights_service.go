package services

import (
	"errors"
	"letun-api/core/repos"
)

type FlightsService struct{}

func (h *FlightsService) Start(flightId int) error {
	flightsRepo := repos.FlightsRepo{}

	flight, err := flightsRepo.GetFlightById(flightId)
	if err != nil {
		return err
	}

	if flight.Status != "accepted" {
		return errors.New("flight is not accepted")
	}

	if flight.Drone.IsFlying {
		return errors.New("drone is already flying")
	}

	if !flight.Drone.IsActive {
		return errors.New("drone is blocked")
	}

	flight.Drone.IsFlying = true
	flight.Status = "started"

	err = flightsRepo.Update(flight)
	if err != nil {
		return err
	}

	droneRepo := repos.DronesRepo{}
	droneRepo.Update(&flight.Drone)

	return nil
}

func (h *FlightsService) Finish(flightId int) error {
	flightsRepo := repos.FlightsRepo{}
	flight, err := flightsRepo.GetFlightById(flightId)
	if err != nil {
		return err
	}

	if flight.Status != "started" {
		return errors.New("flight is not started")
	}

	flight.Drone.IsFlying = false
	flight.Status = "finished"

	err = flightsRepo.Update(flight)
	if err != nil {
		return err
	}

	droneRepo := repos.DronesRepo{}
	droneRepo.Update(&flight.Drone)

	return nil
}

import Drone from "./drone";


export default interface DronesList {
    drones: Drone[] | null;
    total: number;
    maxPage: number;
}
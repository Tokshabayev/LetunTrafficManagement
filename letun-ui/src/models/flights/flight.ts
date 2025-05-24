import Drone from "../drones/drone";
import User from "../users/user";

export default interface Flight {
    id: number;
    drone: Drone;
    user: User;
    status: string;
}
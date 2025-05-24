import Drone from "@/src/models/drones/drone";

export interface DronesState {
    drones: Drone[];
    isLoading: boolean;
    page: number;
    take: number;
    filter: string;
    total: number;
    maxPage: number;
    error: string | undefined;

    createDrone: CreateDrone;
}

export interface CreateDrone {
    model: string;
    weightLimit: string;
    battery: string;
    isValid: boolean;
    isOpen: boolean;
    error: string | undefined;
}

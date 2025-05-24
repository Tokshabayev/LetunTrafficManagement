export default interface Drone {
    id: number;
    model: string;
    weightLimit: number;
    batteryCapacity: number;
    isActive: boolean;
    isFlying: boolean;
}
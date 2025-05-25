export default interface Drone {
    id: number;
    model: string;
    weightLimit: number;
    battery: number;
    isActive: boolean;
    isFlying: boolean;
}
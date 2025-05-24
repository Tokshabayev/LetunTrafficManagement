import Flight from "./flight";


export default interface FlightsList {
    flights: Flight[] | null;
    total: number;
    maxPage: number;
}
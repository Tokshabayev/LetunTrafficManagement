import Flight from "@/src/models/flights/flight";

export interface FlightsState {
  flights: Flight[];
  isLoading: boolean;
  page: number;
  take: number;
  filter: string;
  total: number;
  maxPage: number;
  error: string | undefined;

  createFlight: CreateFlight;
}

export interface CreateFlight {
  points: string;
  isValid: boolean;
  isOpen: boolean;
  error: string | undefined;
}

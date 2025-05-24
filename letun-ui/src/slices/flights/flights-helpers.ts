import afetch from "@/src/core/afetch";
import { RootState } from "@/src/app-store";
import FlightsList from "@/src/models/flights/flights-list";

export const getFlightsParams = (state: RootState["flights"]) => {
  return new URLSearchParams({
    page: state.page.toString(),
    take: state.take.toString(),
    filter: state.filter ?? "",
  });
};

export const fetchFlightsList = async (params: URLSearchParams) => {
  const response = await afetch(
    `https://local.api.letun:8080/flights?${params.toString()}`,
    {
      method: "GET",
    }
  );

  if (response?.status !== 200) throw new Error("Fetch failed");

  const json = await response.json();
  return json as FlightsList;
};

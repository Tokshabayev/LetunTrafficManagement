import afetch from "@/src/core/afetch";
import { RootState } from "@/src/app-store";
import DronesList from "@/src/models/drones/drones-list";

export const getDroneParams = (state: RootState["drones"]) => {
    return new URLSearchParams({
        page: state.page.toString(),
        take: state.take.toString(),
        filter: state.filter ?? "",
    });
};

export const fetchDronesList = async (params: URLSearchParams) => {
    const response = await afetch(
        `https://local.api.letun:8080/drones?${params.toString()}`,
        {
            method: "GET",
        }
    );

    if (response?.status !== 200) throw new Error("Fetch failed");

    const json = await response.json();
    return json as DronesList;
};

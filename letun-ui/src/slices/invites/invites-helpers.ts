import afetch from "@/src/core/afetch";
import { RootState } from "@/src/app-store";
import InvitesList from "@/src/models/invites/invites-list";

export const getInviteParams = (state: RootState["invites"]) => {
  return new URLSearchParams({
    page: state.page.toString(),
    take: state.take.toString(),
    filter: state.filter ?? "",
  });
};

export const fetchInvitesList = async (params: URLSearchParams) => {
  const response = await afetch(
    `https://local.api.letun:8080/invites`,
    {
      method: "GET",
    }
  );

  if (response?.status !== 200) throw new Error("Fetch failed");

  const json = await response.json();
  return json as InvitesList;
};

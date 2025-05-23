import { RootState } from "@/src/app-store";
import afetch from "@/src/core/afetch";

export async function getAllUsers({
  page,
  take,
  filter,
}: {
  page: number;
  take: number;
  filter: string;
}) {
  const params = new URLSearchParams({
    page: page.toString(),
    take: take.toString(),
    filter: filter ?? "",
  });

  const response = await afetch(
    `https://local.api.letun:8080/user/getAll?${params.toString()}`,
    {
      method: "GET",
    }
  );

  if (response?.status != 200) {
    throw new Error("Возникла error");
  }

  return response;
}

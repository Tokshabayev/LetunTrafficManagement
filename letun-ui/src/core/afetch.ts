
import { deleteTokens, getAccessToken, getRefreshToken, storeAccessToken } from "../core/session/session";

const afetch = async (
  url: string,
  options?: RequestInit
): Promise<Response | undefined> => {
  try {
    let token = await getAccessToken();

    if (!token) {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        console.warn("No refresh token, redirecting to login...");
        await deleteTokens();
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        "https://local.api.letun:8080/auth/refreshToken",
        {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            ...options?.headers,
            "X-Refresh-Token": refreshToken,
          },

        },
      );

      if (response.status !== 200) {
        console.warn("Refresh failed, redirecting to login...");
        await deleteTokens();
        window.location.href = "/login";
        return;
      }

      const json = await response.json();
      const resp = json as LoginRefreshResp;

      if (resp.accessToken && resp.accessTokenExpireDate) {
        storeAccessToken({
          accessToken: resp.accessToken,
          accessTokenExpireDate: resp.accessTokenExpireDate,
        });

        token = resp.accessToken;
      } else {
        console.warn("Invalid refresh response, redirecting to login...");
        await deleteTokens();
        window.location.href = "/login";
        return;
      }
    }

    const resp = await fetch(url, {
      ...options,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        ...options?.headers,
        "Authorization": `Bearer ${token}`,
      },
      body: options?.body,
    });

    if (resp.status === 401) {
      console.warn("Fetch failed, redirecting to login...");
      await deleteTokens();
      window.location.href = "/login";
      return;
    }

    return resp;
  } catch (err) {
    console.error("afetch error:", err);
    return;
  }
};


export default afetch;
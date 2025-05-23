"use server";

import { jwtVerify, SignJWT } from "jose";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

// Вычисляем maxAge в секундах на основе даты
const COOKIE_OPTIONS = (expireAt: string): Partial<ResponseCookie> => {
  const utcString = expireAt.replace(" ", "T") + "Z";

  const now = Date.now();
  const expire = Date.parse(utcString);

  const maxAge = Math.floor((expire - now) / 1000);

  return {
    maxAge,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  };
};

async function encrypt(payload: string): Promise<string> {
  const supasecret = process.env.JWT_SECRET ?? "supasecret";
  if (!supasecret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const secret = new TextEncoder().encode(supasecret);

  const token = await new SignJWT({ payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secret);

  return token;
}

async function decrypt(token: string): Promise<string> {
  const supasecret = process.env.JWT_SECRET ?? "supasecret";
  if (!supasecret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(supasecret)
  );

  return payload.payload as string;
}

export const storeTokens = async (data: {
  accessToken: string;
  accessTokenExpireDate: string;
  refreshToken: string;
  refreshTokenExpireDate: string;
}) => {
  const cookieStore = await cookies();

  const accessToken = await encrypt(data.accessToken);
  const refreshToken = await encrypt(data.refreshToken);

  cookieStore.set(
    "Access-Token",
    accessToken,
    COOKIE_OPTIONS(data.accessTokenExpireDate)
  );

  cookieStore.set(
    "Refresh-Token",
    refreshToken,
    COOKIE_OPTIONS(data.refreshTokenExpireDate)
  );
};

export const storeAccessToken = async (data: {
  accessToken: string;
  accessTokenExpireDate: string;
}) => {
  const cookieStore = await cookies();
  const accessToken = await encrypt(data.accessToken);

  cookieStore.set(
    "Access-Token",
    accessToken,
    COOKIE_OPTIONS(data.accessTokenExpireDate)
  );
};

export const getAccessToken = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("Access-Token");

  if (!token) return null;

  const dtoken = await decrypt(token.value);

  return dtoken;

};

export const getRefreshToken = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("Refresh-Token");

  if (!token) return null;

  const dtoken = await decrypt(token.value);

  return dtoken;
};

export const deleteTokens = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("Access-Token");
  cookieStore.delete("Refresh-Token");
};

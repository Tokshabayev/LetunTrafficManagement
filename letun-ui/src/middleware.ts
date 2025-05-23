import { NextRequest, NextResponse } from "next/server";
import { deleteTokens, getAccessToken, getRefreshToken } from "./core/session/session";

const unauthOnlyRoutes = ["/login", "/invite"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isUnauthOnlyRoute = unauthOnlyRoutes.some(route => path.startsWith(route));

  const isProtectedRoute = !isUnauthOnlyRoute;

  const accessToken = await getAccessToken();

  if (isProtectedRoute && !accessToken) {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      await deleteTokens();
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
  }

  if (isUnauthOnlyRoute && accessToken) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

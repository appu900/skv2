import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt, isExpired } from "@/lib/auth/jwt";
import { ROLE_CONFIG, isPortalSlug } from "@/lib/auth/roles";
import { SESSION_COOKIE } from "@/lib/auth/session-cookie";

// Server side guard: a portal page is only served to a logged in user of that portal's role.
// The backend still checks every API call; this only keeps users on the right screens.
export function proxy(request: NextRequest) {
  const [, section, portal] = request.nextUrl.pathname.split("/");

  // /login/<unknown> -> portal chooser (dynamicParams is not available with cacheComponents)
  if (section === "login") {
    return isPortalSlug(portal) ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isPortalSlug(section)) {
    return NextResponse.next();
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? decodeJwt(token) : null;

  if (!claims || isExpired(claims) || claims.role !== ROLE_CONFIG[section].role) {
    const loginUrl = new URL(`/login/${section}`, request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tp/:path*", "/aa/:path*", "/sna/:path*", "/lcrc/:path*", "/toa/:path*", "/toa-assessor/:path*", "/login/:role"],
};

import { NextResponse, type NextRequest } from "next/server";
import { BACKEND_API_URL } from "@/lib/server/config";
import { decodeJwt } from "@/lib/auth/jwt";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session-cookie";

// Changing a ToA password (training partner or assessor) ends the old session on the backend, so the new token has to replace the cookie here.
export async function PUT(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 });

  const { portal, ...body } = (await request.json().catch(() => ({}))) as { portal?: string };
  const path = portal === "toa-assessor" ? "/toa/assessor/me/password" : "/toa/tp/me/password";
  const backendResponse = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-access-token": token },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!backendResponse) {
    return NextResponse.json({ success: false, message: "Backend is not reachable" }, { status: 502 });
  }

  const payload = await backendResponse.json().catch(() => ({}));
  if (!backendResponse.ok) {
    return NextResponse.json({ success: false, message: payload.message || "Could not change the password" }, { status: backendResponse.status });
  }
  const newToken: string | undefined = payload.data?.token;
  const claims = newToken ? decodeJwt(newToken) : null;
  const response = NextResponse.json({ success: true, message: "Password changed" });
  if (newToken && claims) {
    const maxAge = claims.exp ? Math.max(claims.exp - Math.floor(Date.now() / 1000), 60) : 60 * 60 * 24;
    response.cookies.set(SESSION_COOKIE, newToken, sessionCookieOptions(maxAge));
  }
  return response;
}

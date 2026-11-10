import { NextResponse, type NextRequest } from "next/server";
import { BACKEND_API_URL } from "@/lib/server/config";
import { ROLE_CONFIG, isPortalSlug } from "@/lib/auth/roles";
import { decodeJwt } from "@/lib/auth/jwt";
import { PROFILE_COOKIE, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session-cookie";

interface LoginResponseData {
  token?: string;
  name?: string;
  email?: string;
  data?: {
    organizationName?: string;
    registeredOfficeEmail?: string;
    agencyName?: string;
    name?: string;
    email?: string;
    state?: string;
    applicationStatus?: string;
  };
}

interface LoginBody {
  portal?: string;
  email?: string;
  password?: string;
  scheme?: string;
}

// Every backend login answers with a token, but the user details sit in different places.
function extractProfile(portal: string, data: LoginResponseData) {
  switch (portal) {
    case "admin":
      return { name: data.name, email: data.email };
    case "tp":
      return { name: data.data?.organizationName, email: data.data?.registeredOfficeEmail, status: data.data?.applicationStatus };
    case "aa":
      return { name: data.data?.agencyName, email: data.data?.email, status: data.data?.applicationStatus };
    case "sna":
      return { name: `SNA ${data.data?.state ?? ""}`.trim(), email: data.data?.email };
    case "lcrc":
      return { name: data.data?.name, email: data.data?.email };
    case "toa":
      return { name: data.data?.organizationName, email: data.data?.email };
    case "toa-assessor":
      return { name: data.data?.name, email: data.data?.email };
    default:
      return {};
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  if (!body.portal || !isPortalSlug(body.portal)) {
    return NextResponse.json({ success: false, message: "Unknown portal" }, { status: 400 });
  }
  if (!body.email || !body.password) {
    return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 });
  }

  const config = ROLE_CONFIG[body.portal];
  const backendResponse = await fetch(`${BACKEND_API_URL}${config.loginPath}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(request.headers.get("x-forwarded-for") ? { "x-forwarded-for": request.headers.get("x-forwarded-for")!.split(",")[0].trim() } : {}),
      ...(request.headers.get("user-agent") ? { "user-agent": request.headers.get("user-agent")! } : {}),
    },
    body: JSON.stringify({
      [config.emailField]: body.email,
      password: body.password,
      ...(config.needsScheme ? { scheme: body.scheme } : {}),
    }),
  }).catch(() => null);

  if (!backendResponse) {
    return NextResponse.json({ success: false, message: "Backend is not reachable" }, { status: 502 });
  }

  const payload = await backendResponse.json().catch(() => ({}));
  if (!backendResponse.ok) {
    return NextResponse.json(
      { success: false, message: payload.message || "Login failed" },
      { status: backendResponse.status }
    );
  }

  const token: string | undefined = payload.data?.token;
  const claims = token ? decodeJwt(token) : null;
  if (!token || !claims || claims.role !== config.role) {
    return NextResponse.json({ success: false, message: "Unexpected login response" }, { status: 502 });
  }

  const maxAge = claims.exp ? Math.max(claims.exp - Math.floor(Date.now() / 1000), 60) : 60 * 60 * 24;
  const profile = extractProfile(body.portal, payload.data);

  const response = NextResponse.json({ success: true, data: { portal: body.portal, profile } });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(maxAge));
  response.cookies.set(PROFILE_COOKIE, JSON.stringify(profile), sessionCookieOptions(maxAge));
  return response;
}

import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt, isExpired } from "@/lib/auth/jwt";
import { slugForRole } from "@/lib/auth/roles";
import { PROFILE_COOKIE, SESSION_COOKIE } from "@/lib/auth/session-cookie";

// Who is logged in, for the portal header. Never returns the token itself.
export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? decodeJwt(token) : null;
  if (!claims || isExpired(claims)) {
    return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 });
  }

  let profile: Record<string, unknown> = {};
  try {
    profile = JSON.parse(request.cookies.get(PROFILE_COOKIE)?.value || "{}");
  } catch {}

  return NextResponse.json({
    success: true,
    data: {
      id: claims.id,
      role: claims.role,
      portal: slugForRole(claims.role),
      scheme: claims.scheme,
      state: claims.state,
      expiresAt: claims.exp ? claims.exp * 1000 : null,
      ...profile,
    },
  });
}

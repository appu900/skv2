import { NextResponse } from "next/server";
import { PROFILE_COOKIE, SESSION_COOKIE } from "@/lib/auth/session-cookie";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(PROFILE_COOKIE);
  return response;
}

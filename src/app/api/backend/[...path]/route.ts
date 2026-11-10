import { type NextRequest } from "next/server";
import { BACKEND_API_URL } from "@/lib/server/config";
import { SESSION_COOKIE } from "@/lib/auth/session-cookie";

// Forwards /api/backend/* to the Express API and attaches the JWT from the httpOnly cookie,
// so client code calls the backend without ever handling the token.
async function forward(request: NextRequest, ctx: RouteContext<"/api/backend/[...path]">) {
  const { path } = await ctx.params;
  const target = `${BACKEND_API_URL}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) headers.set("x-access-token", token);
  // the backend's rate limits and audit log need the real client, not this server
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  if (clientIp) headers.set("x-forwarded-for", clientIp);
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers.set("user-agent", userAgent);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const backendResponse = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // required by Node fetch when streaming a request body (multipart uploads)
    ...(hasBody ? { duplex: "half" } : {}),
    redirect: "manual",
  } as RequestInit).catch(() => null);

  if (!backendResponse) {
    return Response.json({ success: false, message: "Backend is not reachable" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  const responseType = backendResponse.headers.get("content-type");
  if (responseType) responseHeaders.set("content-type", responseType);
  return new Response(backendResponse.body, { status: backendResponse.status, headers: responseHeaders });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;

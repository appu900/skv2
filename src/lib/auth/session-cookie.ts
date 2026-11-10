// Cookie names shared by proxy.ts and the route handlers. The JWT never reaches browser JavaScript.
export const SESSION_COOKIE = "sap_session";
export const PROFILE_COOKIE = "sap_profile";

export const sessionCookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: maxAgeSeconds,
});

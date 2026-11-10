import axios, { AxiosError } from "axios";
import type { ApiErrorBody } from "./types";

// All browser calls go through the Next.js proxy, which adds the session token.
export const api = axios.create({ baseURL: "/api/backend" });

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    // Session expired or revoked: back to the login page of the current portal.
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const portal = window.location.pathname.split("/")[1];
      if (["admin", "tp", "aa", "sna", "lcrc", "toa", "toa-assessor"].includes(portal)) {
        // full reload on purpose: drops every cached query of the expired session
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/login/${portal}?next=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

// Message to show the user for any failed request.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

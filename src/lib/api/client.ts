import axios, { AxiosError } from "axios";
import { APPLICATION_NOT_APPROVED, type ApiErrorBody } from "./types";

// All browser calls go through the Next.js proxy, which adds the session token.
export const api = axios.create({ baseURL: "/api/backend" });

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    // Session expired or revoked: back to the login page of the current portal.
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const portal = window.location.pathname.split("/")[1];
      if (["admin", "tp", "aa", "sna", "lcrc", "toa", "toa-assessor", "toa-admin"].includes(portal)) {
        // full reload on purpose: drops every cached query of the expired session
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/login/${portal}?next=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    // A training partner whose approval was withdrawn: end the session and show the status page.
    if (error.response?.status === 403 && error.response.data?.error === APPLICATION_NOT_APPROVED && typeof window !== "undefined") {
      const status = (error.response.data as ApiErrorBody & { applicationStatus?: string }).applicationStatus ?? "Pending";
      void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/application-status?status=${encodeURIComponent(status)}`;
      });
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

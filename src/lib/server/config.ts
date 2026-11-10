import "server-only";

// Express backend, e.g. http://localhost:8000/api/v1. Only the Next.js server talks to it directly.
export const BACKEND_API_URL = (process.env.BACKEND_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

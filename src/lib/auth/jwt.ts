import { ROLES, type Role } from "./roles";

export interface SessionClaims {
  id: string;
  role: Role;
  name?: string;
  scheme?: string;
  state?: string;
  exp?: number;
}

// Reads the payload of a JWT without verifying it. The backend verifies the signature on every
// request; the frontend only uses the claims to route the user to the right portal.
export function decodeJwt(token: string): SessionClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as Partial<SessionClaims>;
    if (!claims.id || !claims.role || !ROLES.includes(claims.role)) return null;
    return claims as SessionClaims;
  } catch {
    return null;
  }
}

export function isExpired(claims: SessionClaims): boolean {
  return typeof claims.exp === "number" && claims.exp * 1000 <= Date.now();
}

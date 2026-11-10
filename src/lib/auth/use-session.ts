"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { PortalSlug, Role } from "./roles";

export interface Session {
  id: string;
  role: Role;
  portal: PortalSlug;
  name?: string;
  email?: string;
  status?: string;
  scheme?: string;
  state?: string;
  expiresAt: number | null;
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => (await axios.get<{ data: Session }>("/api/auth/session")).data.data,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

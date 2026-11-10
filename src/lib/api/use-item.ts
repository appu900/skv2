"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./client";
import type { ApiResponse } from "./types";

// GET an endpoint that answers { data: T }.
export function useItem<T>(path: string | null, options: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: ["item", path],
    queryFn: async () => (await api.get<ApiResponse<T>>(path as string)).data.data,
    enabled: Boolean(path),
    refetchInterval: options.refetchInterval,
  });
}

"use client";

import { useQuery, type Query } from "@tanstack/react-query";
import { api } from "./client";
import type { ApiResponse } from "./types";

type RefetchInterval<T> = number | false | ((query: Query<T[], Error, T[], readonly unknown[]>) => number | false | undefined);

// GET an endpoint that answers { data: T[] }, cached by its path.
export function useList<T>(path: string | null, options: { refetchInterval?: RefetchInterval<T> } = {}) {
  return useQuery({
    queryKey: ["list", path] as readonly unknown[],
    queryFn: async () => (await api.get<ApiResponse<T[]>>(path as string)).data.data ?? [],
    enabled: Boolean(path),
    refetchInterval: options.refetchInterval,
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "./client";

// Runs a write call, shows a toast and refreshes every list so the UI never shows stale data.
export function useApiMutation<TVariables, TResult = unknown>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  successMessage: string | ((result: TResult) => string)
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (result) => {
      toast.success(typeof successMessage === "function" ? successMessage(result) : successMessage);
      await queryClient.invalidateQueries({ queryKey: ["list"] });
      await queryClient.invalidateQueries({ queryKey: ["item"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

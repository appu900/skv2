"use client";

import { Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEMED_PATH, useTheme } from "@/lib/theme";

// Toasts match the page: dark only inside a portal that is in dark mode.
function ThemedToaster() {
  const theme = useTheme();
  const pathname = usePathname();
  return <Toaster theme={THEMED_PATH.test(pathname) ? theme : "light"} richColors position="top-right" />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
            // ** a 4xx (not found, forbidden…) will not change on retry, only network / server errors are retried
            retry: (failureCount, error) => !(isAxiosError(error) && (error.response?.status ?? 500) < 500) && failureCount < 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        {/* reads the URL, which must sit inside Suspense on dynamic routes */}
        <Suspense fallback={null}>
          <ThemedToaster />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { useSession } from "@/lib/auth/use-session";
import { Skeleton } from "@/components/ui/skeleton";

function greetingNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const noopSubscribe = () => () => {};

// Depends on the viewer's clock, so it is only computed in the browser (null while prerendering).
function useGreeting() {
  return useSyncExternalStore(noopSubscribe, greetingNow, () => null);
}

export function DashboardHeader({ subtitle, actions }: { subtitle: string; actions?: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const greeting = useGreeting();
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {greeting ? <p className="text-sm text-muted-foreground">{greeting}</p> : <Skeleton className="h-4 w-28" />}
        {isPending ? (
          <Skeleton className="mt-2 h-8 w-64" />
        ) : (
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{session?.name || "Welcome back"}</h1>
        )}
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions}
    </div>
  );
}
